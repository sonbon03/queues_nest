import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  owner: string;

  @Column({ nullable: true })
  spender: string;

  @Column({ nullable: true })
  approved: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  value: string;

  @Column()
  type: string;
}
