/**
 * Official Valenzuela City Address Directory
 * 33 Barangays with legislative districts, postal ZIP codes, and major roads.
 */

export interface ValenzuelaBarangay {
    name: string;
    district: number;
    zipCode: string;
    popularStreets?: string[];
}

export const VALENZUELA_BARANGAYS: ValenzuelaBarangay[] = [
    {
        name: "Arkong Bato",
        district: 1,
        zipCode: "1448",
        popularStreets: ["M.H. Del Pilar Street", "Arkong Bato Road", "Naval Street"],
    },
    {
        name: "Bagbaguin",
        district: 2,
        zipCode: "1443",
        popularStreets: ["General Luis Street", "Bagbaguin Road", "Pico Road"],
    },
    {
        name: "Balangkas",
        district: 1,
        zipCode: "1448",
        popularStreets: ["Balangkas Road", "A. Fernando Street"],
    },
    {
        name: "Bignay",
        district: 1,
        zipCode: "1446",
        popularStreets: ["Bignay Road", "Gitna Street", "P. Gomez Street", "Disiplina Village Road"],
    },
    {
        name: "Bisig",
        district: 1,
        zipCode: "1448",
        popularStreets: ["Bisig Road", "Polo-Bisig Road"],
    },
    {
        name: "Canumay East",
        district: 1,
        zipCode: "1447",
        popularStreets: ["East Service Road", "Canumay East Road", "Sterling Road"],
    },
    {
        name: "Canumay West",
        district: 1,
        zipCode: "1447",
        popularStreets: ["T. Santiago Street", "Paredes Street", "San Francisco Street"],
    },
    {
        name: "Coloong",
        district: 1,
        zipCode: "1444",
        popularStreets: ["Coloong 1 Road", "Coloong 2 Road", "Pasolo-Coloong Road"],
    },
    {
        name: "Dalandanan",
        district: 1,
        zipCode: "1444",
        popularStreets: ["MacArthur Highway", "G. Lazaro Street", "Footwear Road", "Miranda Street"],
    },
    {
        name: "Gen. T. de Leon",
        district: 2,
        zipCode: "1442",
        popularStreets: ["Gen. T. de Leon Road", "Mercado Street", "Independence Street", "Karatula Street"],
    },
    {
        name: "Isla",
        district: 1,
        zipCode: "1448",
        popularStreets: ["Isla Road", "P. Deato Street"],
    },
    {
        name: "Karuhatan",
        district: 2,
        zipCode: "1441",
        popularStreets: ["MacArthur Highway", "Karuhatan Road", "Tamaraw Hills Road", "Fatima Avenue", "A. Bonifacio Street"],
    },
    {
        name: "Lawang Bato",
        district: 1,
        zipCode: "1446",
        popularStreets: ["Lawang Bato Road", "Centro Street", "Sapang Bakaw Road"],
    },
    {
        name: "Lingunan",
        district: 1,
        zipCode: "1447",
        popularStreets: ["P. Faustino Street", "T. Santiago Street", "Lingunan Road"],
    },
    {
        name: "Mabolo",
        district: 1,
        zipCode: "1448",
        popularStreets: ["M.H. Del Pilar Street", "Mabolo Road", "San Diego Street"],
    },
    {
        name: "Malanday",
        district: 1,
        zipCode: "1444",
        popularStreets: ["MacArthur Highway", "M.H. Del Pilar Street", "Malanday Road", "Lingahan Street"],
    },
    {
        name: "Malinta",
        district: 1,
        zipCode: "1440",
        popularStreets: ["MacArthur Highway", "A. Pablo Street", "P. Valenzuela Street", "Malinta Exit"],
    },
    {
        name: "Mapulang Lupa",
        district: 2,
        zipCode: "1443",
        popularStreets: ["Mapulang Lupa Road", "Parada-Mapulang Lupa Road", "East Service Road"],
    },
    {
        name: "Marulas",
        district: 2,
        zipCode: "1440",
        popularStreets: ["MacArthur Highway", "Pio Valenzuela Street", "Serrano Street", "BBB Road", "Doña Ata Street"],
    },
    {
        name: "Maysan",
        district: 2,
        zipCode: "1440",
        popularStreets: ["Maysan Road", "Paso de Blas Road", "Cabral Street", "La Mesa Road"],
    },
    {
        name: "Palasan",
        district: 1,
        zipCode: "1448",
        popularStreets: ["F. Andaya Street", "Palasan Road"],
    },
    {
        name: "Parada",
        district: 2,
        zipCode: "1442",
        popularStreets: ["S. Feliciano Street", "Parada Road", "Fortune Village Road"],
    },
    {
        name: "Pariancillo Villa",
        district: 1,
        zipCode: "1448",
        popularStreets: ["P. Gomez Street", "Pariancillo Villa Road"],
    },
    {
        name: "Paso de Blas",
        district: 2,
        zipCode: "1443",
        popularStreets: ["Paso de Blas Road", "Malinta Exit Road", "Puregold Drive"],
    },
    {
        name: "Pasolo",
        district: 1,
        zipCode: "1445",
        popularStreets: ["Pasolo Road", "G. Deato Street", "Pasolo Dike Road"],
    },
    {
        name: "Poblacion",
        district: 1,
        zipCode: "1440",
        popularStreets: ["P. Valenzuela Street", "San Diego De Alcala Street", "Poblacion Road"],
    },
    {
        name: "Polo",
        district: 1,
        zipCode: "1448",
        popularStreets: ["Polo Market Road", "M.H. Del Pilar Street", "Dr. J.P. Rizal Street"],
    },
    {
        name: "Punturin",
        district: 1,
        zipCode: "1446",
        popularStreets: ["Punturin Road", "1st Street", "2nd Street", "Main Avenue"],
    },
    {
        name: "Rincon",
        district: 1,
        zipCode: "1445",
        popularStreets: ["Rincon Road", "F. Valenzuela Street"],
    },
    {
        name: "Tagalag",
        district: 1,
        zipCode: "1448",
        popularStreets: ["Tagalag Road", "Ecopark Road"],
    },
    {
        name: "Ugong",
        district: 2,
        zipCode: "1442",
        popularStreets: ["Que Grande Road", "Mindanao Avenue Extension", "Ugong Road"],
    },
    {
        name: "Veinte Reales",
        district: 1,
        zipCode: "1448",
        popularStreets: ["MacArthur Highway", "F. Bautista Street", "Veinte Reales Road"],
    },
    {
        name: "Wawang Pulo",
        district: 1,
        zipCode: "1448",
        popularStreets: ["Wawang Pulo Dike Road", "P. Faustino Street"],
    },
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Format address elements into a complete, standardized address string.
 */
export function formatValenzuelaAddress(
    street: string,
    barangay: string,
    city = "Valenzuela City",
    zipCode?: string
): string {
    const cleanStreet = street.trim();
    const cleanBarangay = barangay.trim();
    const cleanCity = city.trim();

    const parts: string[] = [];
    if (cleanStreet) parts.push(cleanStreet);
    if (cleanBarangay) parts.push(cleanBarangay);
    if (cleanCity) parts.push(cleanCity);
    if (zipCode && zipCode.trim()) parts.push(zipCode.trim());

    return parts.join(", ");
}

/**
 * Attempts to parse an existing address string into Valenzuela parts.
 */
export function parseValenzuelaAddress(rawAddress: string): {
    street: string;
    barangay: string;
    city: string;
    zipCode: string;
    isValenzuela: boolean;
} {
    if (!rawAddress || !rawAddress.trim()) {
        return {
            street: "",
            barangay: "Karuhatan",
            city: "Valenzuela City",
            zipCode: "1441",
            isValenzuela: true,
        };
    }

    const lower = rawAddress.toLowerCase();
    const isVal = lower.includes("valenzuela");

    // Match against known barangays
    let matchedBarangay: ValenzuelaBarangay | undefined;
    for (const b of VALENZUELA_BARANGAYS) {
        // match word boundary or full name
        const bLower = b.name.toLowerCase();
        if (lower.includes(bLower)) {
            matchedBarangay = b;
            break;
        }
    }

    if (matchedBarangay && isVal) {
        // Extract street by removing barangay, city, zip
        let street = rawAddress;
        // remove city
        street = street.replace(/valenzuela(\s+city)?/gi, "");
        // remove barangay name
        street = street.replace(new RegExp(`(brgy\\.?|barangay)?\\s*${matchedBarangay.name}`, "gi"), "");
        // remove zip
        street = street.replace(new RegExp(matchedBarangay.zipCode, "g"), "");
        // clean up extra commas, spaces
        street = street.replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,/g, ",");

        return {
            street: street.trim(),
            barangay: matchedBarangay.name,
            city: "Valenzuela City",
            zipCode: matchedBarangay.zipCode,
            isValenzuela: true,
        };
    }

    // Default to freeform
    return {
        street: rawAddress.trim(),
        barangay: "",
        city: "",
        zipCode: "",
        isValenzuela: isVal,
    };
}
