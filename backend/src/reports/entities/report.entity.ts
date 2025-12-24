import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Inventory, { eager: true })
  @JoinTable({
    name: 'report_inventory',
    joinColumn: { name: 'report_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'inventory_id', referencedColumnName: 'id' },
  })
  inventoryItems: Inventory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
