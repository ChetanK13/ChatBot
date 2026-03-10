import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("employment_histories")
export class EmploymentHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "user_id", type: "int" })
    user_id!: number;

    @ManyToOne(() => User, (user) => user.employmentHistories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "varchar", length: 255 })
    company_name!: string;

    @Column({ type: "date" })
    from_date!: Date;

    @Column({ type: "date", nullable: true })
    to_date!: Date | null;

    @Column({ type: "boolean", default: false })
    is_currently_working!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @DeleteDateColumn()
    deleted_at!: Date;
}
