const WORKFLOW_FILE = "publish-desktop-installer.yml";

/**
 * Starts the Windows packaging workflow after a landlord changes the immutable
 * desktop identity (name or logo). Missing configuration is intentionally a
 * no-op so branding itself is never blocked by a release-service outage.
 */
export async function queueBrandedInstaller(targetUrl: string): Promise<boolean> {
  const repository = process.env.GITHUB_DESKTOP_BUILD_REPOSITORY;
  const token = process.env.GITHUB_DESKTOP_BUILD_TOKEN;

  if (!repository || !token) {
    console.info("[Desktop release] Automatic packaging is not configured for this instance.");
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          ref: process.env.GITHUB_DESKTOP_BUILD_REF || "main",
          inputs: { target_url: targetUrl },
        }),
        cache: "no-store",
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Desktop release] Workflow dispatch failed (${response.status}).`);
      return false;
    }

    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("[Desktop release] Workflow dispatch failed:", error);
    return false;
  }
}
