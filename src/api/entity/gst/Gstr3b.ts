import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: "Gstr3b" })
export class Gstr3b extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: 'uuid' })
    userId !: string;

    @Column({ type: 'varchar' })
    gstIn !: string;

    @Column({ type: 'varchar' })
    financialYear !: string;

    @Column({ type: 'varchar' })
    month !: string;

    @Column({ type: 'json', nullable: true })
    outwardAndReverseChargeInward !: {
        ots: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        otsZeroRated: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        oss: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        is: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        os: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
    };

    @Column({ type: 'json', nullable: true })
    suppliesThroughEcommerceOperators !: {
        first: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        second: {
            taxableValue: string;
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
    };

    @Column({ type: 'json', nullable: true })
    interStateSupplies !: {
        nregisteredRows: Array<{
            placeOfSupply: string;
            taxableValue: string;
            integratedTax: string;
        }>;
        compositionRows: Array<{
            placeOfSupply: string;
            taxableValue: string;
            integratedTax: string;
        }>;
        uinRows: Array<{
            placeOfSupply: string;
            taxableValue: string;
            integratedTax: string;
        }>;
    };

    @Column({ type: "json", nullable: true })
    eligibleItc !: {
        importOfGoods: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        importOfServices: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        inwardSuppliesReverseCharge: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        inwardSuppliesFromIsd: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        allOtherItc: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        asPerRules: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        others: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        netItcAvailable: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        itcReclaimed: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        ineligibleItc: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
    }
    
    @Column({ type: 'json', nullable: true })
    inwardSupplies !: {
        supplierUnderScheme: {
            interState: string;
            intraState: string;
        };
        nonGstSupply: {
            interState: string;
            intraState: string;
        };
    };

    @Column({ type: 'json' })
    interestPreviousTaxPeriod !: {
        declare: boolean;
        interest: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
        lateFees: {
            integratedTax: string;
            centralTax: string;
            stateTax: string;
            cess: string;
        };
    };

    @Column({ type: 'json' })
    paymentOfTax !: {
        Tax: {
            cashLedger: {
                igst: string;
                cgst: string;
                sgst: string;
                cess: string;
                total: string;
            };
            creditLedger: {
                igst: string;
                cgst: string;
                sgst: string;
                cess: string;
                total: string;
            };
        };
        Interest: {
            cashLedger: {
                igst: string;
                cgst: string;
                sgst: string;
                cess: string;
                total: string;
            };
            creditLedger: {
                igst: string;
                cgst: string;
                sgst: string;
                cess: string;
                total: string;
            };
        };
        LateFees: {
            cashLedger: {
                igst: string;
                cgst: string;
                sgst: string;
                cess: string;
                total: string;
            };
            creditLedger: {
                igst: string;
                cgst: string;
                sgst: string;
                cess: string;
                total: string;
            };
        };
    };

    @Column({ type: 'varchar', length: 255, default: 'system' })
    createdBy!: string;

    @Column({ type: 'varchar', length: 255, default: 'system' })
    updatedBy!: string;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
    })
    updatedAt!: Date;
}