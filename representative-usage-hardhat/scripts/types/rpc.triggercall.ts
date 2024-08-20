import { ContractTransactionReceipt, TransactionReceipt } from "ethers";

export interface RPCTriggerCall {
    trigger: () => Promise<TransactionReceipt | ContractTransactionReceipt | null>;
}
