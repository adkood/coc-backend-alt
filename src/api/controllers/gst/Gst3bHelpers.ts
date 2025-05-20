import { Gstr1 } from '../../entity/gst/Gstr1';

interface TaxComponents {
    taxableValue: string;
    integratedTax: string;
    centralTax: string;
    stateTax: string;
    cess: string;
}

interface OutwardAndReverseChargeInward {
    "Outward taxable supplies (other than zero rated, nil rated and exempted)": TaxComponents;
    "Outward taxable supplies (zero rated)": TaxComponents;
    "Other outward supplies (Nil rated, exempted)": TaxComponents;
    "Inward supplies (liable to reverse charge)": TaxComponents;
    "(e) Non-GST outward supplies": TaxComponents;
}

export function calculateOutwardAndReverseCharge(gstr1: Gstr1, gstr2bReverseChargeData?: any): OutwardAndReverseChargeInward {
    // Helper function to sum values safely
    const sumValues = (values: Record<string, string> | undefined): number => {
        if (!values) return 0;
        return Object.values(values).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    };

    // Helper to format as string with 2 decimals
    const format = (num: number): string => num.toFixed(2);

    // 1. Calculate normal taxable supplies (B2B, B2C, B2CS, HSN)
    const b2bTaxable = sumValues(gstr1.b2b?.taxableValues);
    const b2bCess = sumValues(gstr1.b2b?.cessValues);
    const b2cTaxable = sumValues(gstr1.b2c?.taxableValues);
    const b2cCess = sumValues(gstr1.b2c?.cessValues);
    const b2csTaxable = parseFloat(gstr1.b2cs?.taxableValue || '0');
    const b2csCess = parseFloat(gstr1.b2cs?.cess || '0');
    
    // HSN calculations (assuming hsn is an array in actual implementation)
    let hsnTaxable = 0;
    let hsnIntegratedTax = 0;
    let hsnCentralTax = 0;
    let hsnStateTax = 0;
    let hsnCess = 0;
    
    if (gstr1.hsn) {
        hsnTaxable = parseFloat(gstr1.hsn.taxableValue || '0');
        hsnIntegratedTax = parseFloat(gstr1.hsn.integratedTax || '0');
        hsnCentralTax = parseFloat(gstr1.hsn.centralTax || '0');
        hsnStateTax = parseFloat(gstr1.hsn.stateTax || '0');
        hsnCess = parseFloat(gstr1.hsn.cess || '0');
    }

    // 2. Calculate zero-rated supplies (exports with payment, SEZ with payment)
    let zeroRatedTaxable = 0;
    let zeroRatedIntegratedTax = 0;
    
    if (gstr1.exports) {
        if (gstr1.exports.gstPayment === 'with payment') {
            zeroRatedTaxable += sumValues(gstr1.exports.taxableValues);
            zeroRatedIntegratedTax += sumValues(gstr1.exports.taxableValues) * 0.18; // Assuming 18% for exports
        }
    }
    
    if (gstr1.b2b?.supplyType === 'sezWithPayment') {
        zeroRatedTaxable += sumValues(gstr1.b2b.taxableValues);
        zeroRatedIntegratedTax += sumValues(gstr1.b2b.taxableValues) * 0.18;
    }

    // 3. Nil rated and exempted supplies
    const nilRated = parseFloat(gstr1.nilRated?.nilRated || '0');
    const exempted = parseFloat(gstr1.nilRated?.exempted || '0');

    // 4. Non-GST supplies
    const nonGst = parseFloat(gstr1.nilRated?.nonGst || '0');

    // 5. Reverse charge (from GSTR-2B)
    const reverseChargeTaxable = parseFloat(gstr2bReverseChargeData?.taxableValue || '0');
    const reverseChargeIntegratedTax = parseFloat(gstr2bReverseChargeData?.integratedTax || '0');
    const reverseChargeCentralTax = parseFloat(gstr2bReverseChargeData?.centralTax || '0');
    const reverseChargeStateTax = parseFloat(gstr2bReverseChargeData?.stateTax || '0');
    const reverseChargeCess = parseFloat(gstr2bReverseChargeData?.cess || '0');

    // Calculate totals for normal taxable supplies
    const normalTaxableValue = b2bTaxable + b2cTaxable + b2csTaxable + hsnTaxable - zeroRatedTaxable;
    
    // Note: This is a simplified calculation. In production, you would need to:
    // 1. Calculate taxes based on actual rates for each invoice
    // 2. Handle differential tax cases
    // 3. Properly segregate IGST vs CGST+SGST based on POS
    
    // For demo, assuming 18% tax rate and 50% split for CGST/SGST when not IGST
    const normalIntegratedTax = normalTaxableValue * 0.18; // Simplified
    const normalCentralTax = normalTaxableValue * 0.09; // Simplified
    const normalStateTax = normalTaxableValue * 0.09; // Simplified
    const normalCess = b2bCess + b2cCess + b2csCess + hsnCess;

    return {
        "Outward taxable supplies (other than zero rated, nil rated and exempted)": {
            taxableValue: format(normalTaxableValue),
            integratedTax: format(normalIntegratedTax),
            centralTax: format(normalCentralTax),
            stateTax: format(normalStateTax),
            cess: format(normalCess)
        },
        "Outward taxable supplies (zero rated)": {
            taxableValue: format(zeroRatedTaxable),
            integratedTax: format(zeroRatedIntegratedTax),
            centralTax: "0.00",
            stateTax: "0.00",
            cess: "0.00"
        },
        "Other outward supplies (Nil rated, exempted)": {
            taxableValue: format(nilRated + exempted),
            integratedTax: "0.00",
            centralTax: "0.00",
            stateTax: "0.00",
            cess: "0.00"
        },
        "Inward supplies (liable to reverse charge)": {
            taxableValue: format(reverseChargeTaxable),
            integratedTax: format(reverseChargeIntegratedTax),
            centralTax: format(reverseChargeCentralTax),
            stateTax: format(reverseChargeStateTax),
            cess: format(reverseChargeCess)
        },
        "(e) Non-GST outward supplies": {
            taxableValue: format(nonGst),
            integratedTax: "0.00",
            centralTax: "0.00",
            stateTax: "0.00",
            cess: "0.00"
        }
    };
}

interface EcommerceTaxComponents {
    taxableValue: string;
    integratedTax: string;
    centralTax: string;
    stateTax: string;
    cess: string;
}

interface SuppliesThroughEcommerce {
    "(i) Taxable supplies on which electronic commerce operator pays tax u/s 9(5)": EcommerceTaxComponents;
    "(ii) Taxable supplies made by registered person through electronic commerce operator": EcommerceTaxComponents;
}

export function calculateEcommerceSupplies(gstr1: Gstr1): SuppliesThroughEcommerce {
    // Helper function to format as string with 2 decimals
    const format = (num: number): string => num.toFixed(2);

    // Initialize values
    let operatorPaysTaxable = 0;
    let operatorPaysIGST = 0;
    let operatorPaysCGST = 0;
    let operatorPaysSGST = 0;
    let operatorPaysCess = 0;

    let registeredPersonPaysTaxable = 0;
    let registeredPersonPaysIGST = 0;
    let registeredPersonPaysCGST = 0;
    let registeredPersonPaysSGST = 0;
    let registeredPersonPaysCess = 0;

    // Process suppliesThroughEco data (Section 8 of GSTR-1)
    if (gstr1.suppliesThroughEco) {
        operatorPaysTaxable = parseFloat(gstr1.suppliesThroughEco.netValue || '0');
        operatorPaysIGST = parseFloat(gstr1.suppliesThroughEco.integratedTax || '0');
        operatorPaysCGST = parseFloat(gstr1.suppliesThroughEco.centralTax || '0');
        operatorPaysSGST = parseFloat(gstr1.suppliesThroughEco.stateTax || '0');
        operatorPaysCess = parseFloat(gstr1.suppliesThroughEco.cess || '0');
    }

    // Process B2B supplies where supplyType indicates e-commerce (Section 4 of GSTR-1)
    if (gstr1.suppliesB2b) {
        // This assumes suppliesB2b contains both regular and e-commerce supplies
        // You'll need to filter for e-commerce supplies specifically
        // Example criteria: supplyType contains 'ecommerce' or similar
        
        registeredPersonPaysTaxable = parseFloat(gstr1.suppliesB2b.totalValue || '0');
        registeredPersonPaysIGST = sumValues(gstr1.suppliesB2b.taxableValues) * 0.18; // Simplified
        registeredPersonPaysCGST = sumValues(gstr1.suppliesB2b.taxableValues) * 0.09; // Simplified
        registeredPersonPaysSGST = sumValues(gstr1.suppliesB2b.taxableValues) * 0.09; // Simplified
        registeredPersonPaysCess = sumValues(gstr1.suppliesB2b.cessValues);
    }

    return {
        "(i) Taxable supplies on which electronic commerce operator pays tax u/s 9(5)": {
            taxableValue: format(operatorPaysTaxable),
            integratedTax: format(operatorPaysIGST),
            centralTax: format(operatorPaysCGST),
            stateTax: format(operatorPaysSGST),
            cess: format(operatorPaysCess)
        },
        "(ii) Taxable supplies made by registered person through electronic commerce operator": {
            taxableValue: format(registeredPersonPaysTaxable),
            integratedTax: format(registeredPersonPaysIGST),
            centralTax: format(registeredPersonPaysCGST),
            stateTax: format(registeredPersonPaysSGST),
            cess: format(registeredPersonPaysCess)
        }
    };

    // Helper function to sum values safely
    function sumValues(values: Record<string, string> | undefined): number {
        if (!values) return 0;
        return Object.values(values).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    }
}