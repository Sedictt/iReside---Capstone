import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "source-of-truth-db.sql");
const migrationsDir = path.join(root, "supabase", "migrations");
const outputDir = path.join(root, "docs", "database-inventory");
const jsonOut = path.join(outputDir, "inventory.json");
const mdOut = path.join(outputDir, "summary.md");

function readText(filePath) {
  const bytes = fs.readFileSync(filePath);
  const hasUtf16Nulls = bytes.length > 1 && bytes.subarray(0, Math.min(bytes.length, 200)).some((byte, index) => index % 2 === 1 && byte === 0);
  return bytes.toString(hasUtf16Nulls ? "utf16le" : "utf8");
}

function readMigrationsSql() {
  if (!fs.existsSync(migrationsDir)) return "";

  return fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => `\n\n-- ${file}\n${readText(path.join(migrationsDir, file))}`)
    .join("");
}

const sql = `${readText(schemaPath)}${readMigrationsSql()}`;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["node_modules", ".next", "graphify-out"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(ts|tsx|js|jsx|mjs|sql)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseTables(schemaSql) {
  const tables = new Map();
  const tableRegex = /CREATE TABLE IF NOT EXISTS\s+(?:"public"\."([^"]+)"|public\.([a-zA-Z_][a-zA-Z0-9_]*))\s*\(([\s\S]*?)\n\);/g;

  for (const match of schemaSql.matchAll(tableRegex)) {
    const [, quotedTableName, unquotedTableName, body] = match;
    const tableName = quotedTableName ?? unquotedTableName;
    const columns = [];

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      const columnMatch = line.match(/^(?:"([^"]+)"|([a-zA-Z_][a-zA-Z0-9_]*))\s+(.+?)(?:,$|$)/);
      if (!columnMatch) continue;

      const [, quotedName, unquotedName, definition] = columnMatch;
      const name = quotedName ?? unquotedName;
      if (name === "CONSTRAINT") continue;

      columns.push({
        name,
        definition: definition.trim(),
        inlinePrimaryKey: /\bPRIMARY KEY\b/i.test(definition),
        nullable: !/\bNOT NULL\b/i.test(definition),
        default: /\bDEFAULT\b/i.test(definition),
        json: /\bjsonb?\b/i.test(definition),
        array: /\[\]/.test(definition),
      });
    }

    tables.set(tableName, { name: tableName, columns });
  }

  return tables;
}

function parseViews(schemaSql) {
  const views = new Set();
  const viewRegex = /CREATE OR REPLACE VIEW\s+"public"\."([^"]+)"/g;
  for (const [, viewName] of schemaSql.matchAll(viewRegex)) {
    views.add(viewName);
  }
  return views;
}

function parseFunctions(schemaSql) {
  const functions = new Map();
  const functionRegex = /CREATE(?: OR REPLACE)? FUNCTION\s+"public"\."([^"]+)"[\s\S]*?\n\$\$;/g;
  for (const match of schemaSql.matchAll(functionRegex)) {
    const [definition, functionName] = match;
    functions.set(functionName, { name: functionName, definition });
  }
  return functions;
}

function parseTriggers(schemaSql) {
  const triggers = [];
  const triggerRegex = /CREATE(?: OR REPLACE)? TRIGGER\s+"([^"]+)"[\s\S]*?ON\s+"public"\."([^"]+)"[\s\S]*?EXECUTE FUNCTION\s+"public"\."([^"]+)"/g;
  for (const [, name, table, functionName] of schemaSql.matchAll(triggerRegex)) {
    triggers.push({ name, table, functionName });
  }
  return triggers;
}

function attachFunctionDependencies(functions, tableNames) {
  for (const fn of functions.values()) {
    const references = [];
    for (const tableName of tableNames) {
      const escapedTable = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tablePattern = new RegExp(`(?:\\bfrom\\s+|\\bjoin\\s+|\\binto\\s+|\\bupdate\\s+|\\btable\\s+)(?:"public"\\.)?${escapedTable}\\b`, "i");
      const quotedTablePattern = new RegExp(`"public"\\."${escapedTable}"`, "i");
      if (tablePattern.test(fn.definition) || quotedTablePattern.test(fn.definition)) {
        references.push(tableName);
      }
    }
    fn.tableReferences = references.sort();
  }
}

function parseFunctionGrants(schemaSql) {
  const grants = new Map();
  const grantRegex = /GRANT\s+(.+?)\s+ON FUNCTION\s+"public"\."([^"]+)".*?\s+TO\s+"?([a-z_]+)"?;/g;
  for (const [, privilege, functionName, role] of schemaSql.matchAll(grantRegex)) {
    if (!grants.has(functionName)) grants.set(functionName, []);
    grants.get(functionName).push({ privilege, role });
  }

  const revokeRegex = /REVOKE\s+.+?\s+ON FUNCTION\s+public\.([a-zA-Z_][a-zA-Z0-9_]*)\(.*?\)\s+FROM\s+([^;]+);/g;
  for (const [, functionName, rolesRaw] of schemaSql.matchAll(revokeRegex)) {
    const revokedRoles = rolesRaw
      .split(",")
      .map((role) => role.trim().replaceAll("\"", ""))
      .filter(Boolean);

    if (!grants.has(functionName)) continue;
    grants.set(
      functionName,
      grants.get(functionName).filter((grant) => !revokedRoles.includes(grant.role)),
    );
  }

  return grants;
}

function parseIndexesAndConstraints(schemaSql, tables) {
  for (const table of tables.values()) {
    table.foreignKeys = [];
    table.indexes = [];
    table.uniques = [];
    const inlinePk = table.columns.find((column) => column.inlinePrimaryKey);
    table.primaryKey = inlinePk ? { name: `${table.name}_${inlinePk.name}_inline_pkey`, columns: inlinePk.name } : null;
    table.policies = [];
    table.rlsEnabled = false;
  }

  const pkRegex = /ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT "([^"]+)" PRIMARY KEY \(([^)]+)\);/g;
  for (const [, table, name, columns] of schemaSql.matchAll(pkRegex)) {
    if (tables.has(table)) tables.get(table).primaryKey = { name, columns };
  }

  const uniqueRegex = /ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT "([^"]+)" UNIQUE \(([^)]+)\);/g;
  for (const [, table, name, columns] of schemaSql.matchAll(uniqueRegex)) {
    if (tables.has(table)) tables.get(table).uniques.push({ name, columns });
  }

  const fkRegex = /ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT "([^"]+)" FOREIGN KEY \(([^)]+)\) REFERENCES "public"\."([^"]+)"\(([^)]+)\)([^;]*);/g;
  for (const [, table, name, columns, referencedTable, referencedColumns, options] of schemaSql.matchAll(fkRegex)) {
    if (tables.has(table)) {
      tables.get(table).foreignKeys.push({ name, columns, referencedTable, referencedColumns, options: options.trim() });
    }
  }

  const indexRegex = /CREATE (UNIQUE )?INDEX "([^"]+)" ON "public"\."([^"]+)" USING "([^"]+)" \(([^;]+)\);/g;
  for (const [, unique, name, table, method, columns] of schemaSql.matchAll(indexRegex)) {
    if (tables.has(table)) tables.get(table).indexes.push({ name, unique: Boolean(unique), method, columns });
  }

  const policies = parsePolicyState(schemaSql);
  for (const policy of policies) {
    if (tables.has(policy.table)) tables.get(policy.table).policies.push(policy);
  }

  const rlsRegex = /ALTER TABLE\s+(?:"public"\."([^"]+)"|public\.([a-zA-Z_][a-zA-Z0-9_]*))\s+ENABLE ROW LEVEL SECURITY;/g;
  for (const [, quotedTable, unquotedTable] of schemaSql.matchAll(rlsRegex)) {
    const table = quotedTable ?? unquotedTable;
    if (tables.has(table)) tables.get(table).rlsEnabled = true;
  }
}

function parsePolicyState(schemaSql) {
  const policies = new Map();
  const statements = schemaSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const dropMatch = statement.match(/DROP POLICY IF EXISTS\s+"([^"]+)"\s+ON\s+(?:"public"\."([^"]+)"|public\.([a-zA-Z_][a-zA-Z0-9_]*))/i);
    if (dropMatch) {
      const [, name, quotedTable, unquotedTable] = dropMatch;
      policies.delete(`${quotedTable ?? unquotedTable}:${name}`);
      continue;
    }

    const createMatch = statement.match(/CREATE POLICY\s+"([^"]+)"\s+ON\s+(?:"public"\."([^"]+)"|public\.([a-zA-Z_][a-zA-Z0-9_]*))(?:\s+AS\s+\w+)?(?:\s+FOR\s+(\w+))?/i);
    if (!createMatch) continue;

    const [, name, quotedTable, unquotedTable, commandRaw] = createMatch;
    const table = quotedTable ?? unquotedTable;
    const command = (commandRaw ?? "ALL").toUpperCase();
    const definition = `${statement};`;
    policies.set(`${table}:${name}`, {
      name,
      table,
      command,
      definition,
      unwrappedAuthCalls: hasUnwrappedAuthCall(definition),
    });
  }

  return [...policies.values()];
}

function hasUnwrappedAuthCall(definition) {
  const authCallRegex = /(?:"auth"\."(?:uid|jwt)"|auth\.(?:uid|jwt))\(\)/gi;

  for (const match of definition.matchAll(authCallRegex)) {
    const before = definition.slice(Math.max(0, match.index - 32), match.index).toLowerCase();
    if (!/\(\s*select\s+$/.test(before)) return true;
  }

  return false;
}

function buildPolicyDiagnostics(tables) {
  const multiplePermissivePolicies = [];
  const authRlsInitPlan = [];

  for (const table of tables.values()) {
    const commandCounts = new Map();
    for (const policy of table.policies) {
      commandCounts.set(policy.command, (commandCounts.get(policy.command) ?? 0) + 1);
      if (policy.unwrappedAuthCalls) {
        authRlsInitPlan.push({ table: table.name, policy: policy.name, command: policy.command });
      }
    }

    for (const [command, count] of commandCounts.entries()) {
      if (count > 1) multiplePermissivePolicies.push({ table: table.name, command, count });
    }
  }

  return {
    authRlsInitPlan,
    multiplePermissivePolicies,
  };
}

function parseCodeReferences() {
  const refs = new Map();
  const storageRefs = new Map();
  const rpcRefs = new Map();
  const files = walk(path.join(root, "src")).concat(walk(path.join(root, "tests")));
  const fromRegex = /\.from\(\s*(?:["']([^"']+)["']|`([^`]+)`)/g;
  const storageRegex = /\.storage\.from\(\s*(?:["']([^"']+)["']|`([^`]+)`|([A-Z_][A-Z0-9_]*))/g;
  const rpcRegex = /\.rpc\(\s*(?:["']([^"']+)["']|`([^`]+)`)/g;
  const constStringRegex = /const\s+([A-Z_][A-Z0-9_]*)\s*=\s*["']([^"']+)["']/g;

  for (const file of files) {
    const content = readText(file);
    const relativeFile = path.relative(root, file).replaceAll("\\", "/");
    const constants = {};

    for (const match of content.matchAll(constStringRegex)) {
      constants[match[1]] = match[2];
    }

    for (const match of content.matchAll(fromRegex)) {
      const before = content.slice(Math.max(0, match.index - 30), match.index);
      if (before.includes(".storage")) continue;

      const table = match[1] ?? match[2];
      if (table.includes("-")) {
        if (!storageRefs.has(table)) storageRefs.set(table, []);
        storageRefs.get(table).push(relativeFile);
        continue;
      }

      if (!refs.has(table)) refs.set(table, []);
      refs.get(table).push(relativeFile);
    }

    for (const match of content.matchAll(storageRegex)) {
      const bucket = match[1] ?? match[2] ?? constants[match[3]] ?? match[3];
      if (!storageRefs.has(bucket)) storageRefs.set(bucket, []);
      storageRefs.get(bucket).push(relativeFile);
    }

    for (const match of content.matchAll(rpcRegex)) {
      const rpc = match[1] ?? match[2];
      if (!rpcRefs.has(rpc)) rpcRefs.set(rpc, []);
      rpcRefs.get(rpc).push(relativeFile);
    }
  }

  return { refs, storageRefs, rpcRefs };
}

function countLintWarnings() {
  const lintPath = path.join(root, "supabase", "Supabase Performance Security Lints (default).md");
  if (!fs.existsSync(lintPath)) return {};

  const lines = readText(lintPath).split(/\r?\n/);
  const counts = {};
  for (const line of lines) {
    const match = line.match(/^\| ([a-z_]+)\s+\|/);
    if (!match || match[1] === "name") continue;
    counts[match[1]] = (counts[match[1]] ?? 0) + 1;
  }
  return counts;
}

const tables = parseTables(sql);
const views = parseViews(sql);
const functions = parseFunctions(sql);
const triggers = parseTriggers(sql);
const tableNames = new Set(tables.keys());
parseIndexesAndConstraints(sql, tables);
attachFunctionDependencies(functions, tableNames);
const functionGrants = parseFunctionGrants(sql);
const policyDiagnostics = buildPolicyDiagnostics(tables);

const { refs, storageRefs, rpcRefs } = parseCodeReferences();
const referencedTables = new Set(refs.keys());
const databaseObjectNames = new Set([...tableNames, ...views]);
const referencedFunctions = new Set(rpcRefs.keys());
const triggerFunctions = new Set(triggers.map((trigger) => trigger.functionName));
const functionTableReferences = new Map();
for (const fn of functions.values()) {
  for (const tableName of fn.tableReferences) {
    if (!functionTableReferences.has(tableName)) functionTableReferences.set(tableName, []);
    functionTableReferences.get(tableName).push(fn.name);
  }
}

const inventory = {
  generatedAt: new Date().toISOString(),
  schema: path.relative(root, schemaPath).replaceAll("\\", "/"),
  migrations: path.relative(root, migrationsDir).replaceAll("\\", "/"),
  tableCount: tables.size,
  viewCount: views.size,
  views: [...views].sort(),
  functionCount: functions.size,
  triggerCount: triggers.length,
  functions: Object.fromEntries(
    [...functions.entries()].sort().map(([name, fn]) => [
      name,
      {
        tableReferences: fn.tableReferences,
        grants: functionGrants.get(name) ?? [],
      },
    ]),
  ),
  triggers: triggers.sort((a, b) => a.table.localeCompare(b.table) || a.name.localeCompare(b.name)),
  referencedTableCount: referencedTables.size,
  referencedFunctionCount: referencedFunctions.size,
  lintWarnings: countLintWarnings(),
  policyDiagnostics,
  missingInSchema: [...referencedTables].filter((table) => !databaseObjectNames.has(table)).sort(),
  rpcMissingInSchema: [...referencedFunctions].filter((fn) => !functions.has(fn)).sort(),
  unreferencedFunctionsInCode: [...functions.keys()].filter((fn) => !referencedFunctions.has(fn) && !triggerFunctions.has(fn)).sort(),
  functionsGrantedToAnon: [...functions.entries()]
    .filter(([, fn]) => (functionGrants.get(fn.name) ?? []).some((grant) => grant.role === "anon"))
    .map(([name]) => name)
    .sort(),
  unreferencedInCode: [...tableNames].filter((table) => !referencedTables.has(table)).sort(),
  unreferencedInCodeButFunctionReferenced: [...tableNames]
    .filter((table) => !referencedTables.has(table) && functionTableReferences.has(table))
    .sort(),
  rpcReferences: Object.fromEntries(
    [...rpcRefs.entries()].sort().map(([name, files]) => [name, [...new Set(files)].sort()]),
  ),
  storageBucketsReferenced: Object.fromEntries([...storageRefs.entries()].sort()),
  tables: Object.fromEntries(
    [...tables.entries()].sort().map(([name, table]) => [
      name,
      {
        ...table,
        codeReferenceCount: refs.get(name)?.length ?? 0,
        codeReferenceFiles: [...new Set(refs.get(name) ?? [])].sort(),
        functionReferences: [...new Set(functionTableReferences.get(name) ?? [])].sort(),
        riskSignals: [
          table.columns.some((column) => column.json) ? "json_columns" : null,
          table.columns.some((column) => column.array) ? "array_columns" : null,
          !table.primaryKey ? "missing_primary_key" : null,
          table.rlsEnabled && table.policies.length === 0 ? "rls_enabled_without_policies" : null,
          table.policies.some((policy) => policy.unwrappedAuthCalls) ? "unwrapped_auth_rls_calls" : null,
          !table.rlsEnabled ? "rls_not_enabled" : null,
        ].filter(Boolean),
      },
    ]),
  ),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonOut, `${JSON.stringify(inventory, null, 2)}\n`);

const heavilyReferenced = Object.values(inventory.tables)
  .sort((a, b) => b.codeReferenceCount - a.codeReferenceCount)
  .slice(0, 15);

const riskyTables = Object.values(inventory.tables)
  .filter((table) => table.riskSignals.length > 0)
  .sort((a, b) => b.riskSignals.length - a.riskSignals.length || a.name.localeCompare(b.name));

const md = [
  "# Database Inventory Summary",
  "",
  `Generated: ${inventory.generatedAt}`,
  `Schema source: \`${inventory.schema}\``,
  `Migration overlay: \`${inventory.migrations}\``,
  "",
  "## Counts",
  "",
  `- Schema tables: ${inventory.tableCount}`,
  `- Schema views: ${inventory.viewCount}`,
  `- Schema functions: ${inventory.functionCount}`,
  `- Schema triggers: ${inventory.triggerCount}`,
  `- Tables referenced from code/tests: ${inventory.referencedTableCount}`,
  `- RPC functions referenced from code/tests: ${inventory.referencedFunctionCount}`,
  `- Missing in schema: ${inventory.missingInSchema.length}`,
  `- RPC functions missing in schema: ${inventory.rpcMissingInSchema.length}`,
  `- Unreferenced in code/tests: ${inventory.unreferencedInCode.length}`,
  `- Functions not referenced by code RPC or triggers: ${inventory.unreferencedFunctionsInCode.length}`,
  `- Functions granted to anon: ${inventory.functionsGrantedToAnon.length}`,
  "",
  "## Supabase Lint Warning Baseline",
  "",
  ...Object.entries(inventory.lintWarnings).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Local RLS Diagnostics After Migration Overlay",
  "",
  `- Unwrapped auth.uid/auth.jwt policy calls: ${inventory.policyDiagnostics.authRlsInitPlan.length}`,
  `- Tables with multiple policies for the same command: ${inventory.policyDiagnostics.multiplePermissivePolicies.length}`,
  "",
  "### Multiple Policy Tables",
  "",
  ...(inventory.policyDiagnostics.multiplePermissivePolicies.length
    ? inventory.policyDiagnostics.multiplePermissivePolicies
      .slice(0, 25)
      .map((item) => `- \`${item.table}\` ${item.command}: ${item.count} policies`)
    : ["- None"]),
  "",
  "## Referenced Tables Missing From Schema",
  "",
  ...(inventory.missingInSchema.length ? inventory.missingInSchema.map((name) => `- \`${name}\``) : ["- None"]),
  "",
  "## Referenced RPC Functions Missing From Schema",
  "",
  ...(inventory.rpcMissingInSchema.length ? inventory.rpcMissingInSchema.map((name) => `- \`${name}\``) : ["- None"]),
  "",
  "## Schema Tables Not Directly Referenced From Code",
  "",
  ...inventory.unreferencedInCode.map((name) => `- \`${name}\``),
  "",
  "## Schema Tables Only Referenced Indirectly By SQL Functions",
  "",
  ...(inventory.unreferencedInCodeButFunctionReferenced.length
    ? inventory.unreferencedInCodeButFunctionReferenced.map((name) => `- \`${name}\`: ${inventory.tables[name].functionReferences.join(", ")}`)
    : ["- None"]),
  "",
  "## Schema Functions Not Referenced By Code RPC Or Triggers",
  "",
  ...inventory.unreferencedFunctionsInCode.map((name) => `- \`${name}\``),
  "",
  "## Schema Functions Granted To Anon",
  "",
  ...(inventory.functionsGrantedToAnon.length ? inventory.functionsGrantedToAnon.map((name) => `- \`${name}\``) : ["- None"]),
  "",
  "## Referenced RPC Functions",
  "",
  ...(Object.keys(inventory.rpcReferences).length
    ? Object.entries(inventory.rpcReferences).map(([name, files]) => `- \`${name}\`: ${files.length} files`)
    : ["- None"]),
  "",
  "## Most Referenced Tables",
  "",
  ...heavilyReferenced.map((table) => `- \`${table.name}\`: ${table.codeReferenceCount} references across ${table.codeReferenceFiles.length} files`),
  "",
  "## Tables With Structural Risk Signals",
  "",
  ...riskyTables.map((table) => `- \`${table.name}\`: ${table.riskSignals.join(", ")}`),
  "",
  "## Referenced Storage Buckets",
  "",
  ...Object.entries(inventory.storageBucketsReferenced).map(([bucket, files]) => `- \`${bucket}\`: ${[...new Set(files)].length} files`),
  "",
].join("\n");

fs.writeFileSync(mdOut, md);

console.log(`Wrote ${path.relative(root, jsonOut)}`);
console.log(`Wrote ${path.relative(root, mdOut)}`);
