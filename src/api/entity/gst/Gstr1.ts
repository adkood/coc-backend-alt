import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

@Entity({ name: "Gstr1" })
export class Gstr1 extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar", length: 255 })
    financialYear!: string;

    @Column({ type: "varchar", length: 255 })
    quarter!: string;

    @Column({ type: "varchar", length: 255 })
    month!: string;

    @Column({ type: "varchar", length: 255 })
    gstIn!: string;

    @Column({ type: "varchar", length: 36 }) 
    userId!: string;

    @Column({ type: 'json', nullable: true })
    b2b!: {
        deemedExports: boolean;
        sezWithPayment: boolean;
        sezWithoutPayment: boolean;
        reverseCharge: boolean;
        intraStateIGST: boolean;
        isDifferentialTax: boolean;
        recipientGSTIN: string;
        recipientName: string;
        masterName: string;
        invoiceNo: string;
        invoiceDate: string;
        totalValue: string;
        pos: string;
        supplyType: string;
        source: string;
        irn: string;
        irnDate: string;
        taxableValues: Record<string, string>;
        cessValues: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    b2c!: {
        isDifferentialTax: boolean;
        pos: string;
        invoiceNo: string;
        invoiceDate: string;
        supplyType: string;
        totalValue: string;
        taxableValues: Record<string, string>;
        cessValues: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    b2cs!: {
        pos: string;
        taxableValue: string;
        supplyType: string;
        isDifferentialTax: boolean;
        rate: string;
        cgst: string;
        sgst: string;
        igst: string;
        cess: string;
    };

    @Column({ type: 'json', nullable: true })
    exports!: {
        invoiceNo: string;
        invoiceDate: string;
        portCode: string;
        shippingBillNo: string;
        shippingBillDate: string;
        totalValue: string;
        supplyType: string;
        gstPayment: string;
        source: string;
        irn: string;
        irnDate: string;
        taxableValues: Record<string, string>;
        cessValues: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    nilRated!: {
        description: string;
        nilRated: string;
        exempted: string;
        nonGst: string;
    };

    @Column({ type: 'json', nullable: true })
    credit!: {
        deemedExports: boolean;
        sezWithPayment: boolean;
        sezWithoutPayment: boolean;
        reverseCharge: boolean;
        intraStateIGST: boolean;
        isDifferentialTax: boolean;
        recipientGSTIN: string;
        recipientName: string;
        masterName: string;
        noteNumber: string;
        noteDate: string;
        noteType: string;
        noteValue: string;
        pos: string;
        supplyType: string;
        source: string;
        irn: string;
        irnDate: string;
        taxableValues: Record<string, string>;
        cessValues: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    creditUnregistered!: {
        isDifferentialTax: boolean;
        type: string;
        noteNumber: string;
        noteDate: string;
        noteValue: string;
        noteType: string;
        pos: string;
        supplyType: string;
        source: string;
        irn: string;
        irnDate: string;
        taxableValues: Record<string, string>;
        cessValues: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    taxLiability!: {
        pos: string;
        supplyType: string;
        isDifferentialTax: boolean;
        advances: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    adjustments!: {
        pos: string;
        supplyType: string;
        isDifferentialTax: boolean;
        adjustments: Record<string, string>;
    };

    @Column({ type: 'json', nullable: true })
    hsn!: {
        hsn: string;
        description: string;
        productName: string;
        uqc: string;
        quantity: string;
        taxableValue: string;
        rate: string;
        integratedTax: string;
        centralTax: string;
        stateTax: string;
        cess: string;
    };

    @Column({ type: 'json', nullable: true })
    documents!: {
        rows1: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows2: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows3: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows4: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows5: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows6: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows7: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows8: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows9: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows10: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows11: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
        rows12: Array<{
            id: number;
            from: string;
            to: string;
            total: string;
            cancelled: string;
            netIssued: string;
        }>;
    };

    @Column({ type: 'json', nullable: true })
    suppliesThroughEco!: {
        gstin: string;
        legalName: string;
        netValue: string;
        integratedTax: string;
        centralTax: string;
        stateTax: string;
        cess: string;
    };

    @Column({ type: 'json', nullable: true })
    suppliesB2b!: {
        deemedExports: boolean;
        sezWithPayment: boolean;
        sezWithoutPayment: boolean;
        supplierGstin: string;
        supplierName: string;
        recipientGstin: string;
        recipientName: string;
        documentNumber: string;
        documentDate: string;
        totalValue: string;
        pos: string;
        supplyType: string;
        taxableValues: Record<string, string>;
        cessValues: Record<string, string>;
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