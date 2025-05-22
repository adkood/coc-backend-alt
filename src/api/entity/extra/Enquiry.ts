import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

@Entity({ name: "Enquiry" })
export class Enquiry extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar" })
    fullName !: string;

    @Column({ type: "varchar" })
    mobileNumber !: string;

    @Column({ type: "varchar" })
    emailAddress !: string;

    @Column({ type: "text" })
    query !: string;

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