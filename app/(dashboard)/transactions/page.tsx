"use client"
import { Loader2, Plus } from "lucide-react";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { transactions as transactionSchema } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { columns } from "./coloums";
import { DataTable } from "@/components/data-table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useBulkCreateTransactions } from "@/features/transactions/api/use-bulk-create-transactions copy";
import { useState } from "react";
import { useBulkDeleteTransactions } from "@/features/transactions/api/use-bulk-delete-transactions";
import { useGetTransactions } from "@/features/transactions/api/use-get-trasactions";
import { toast } from "sonner";
import { UploadButton } from "./upload-button";
import { ImportCard } from "./import-card";
import { useSelectAccount } from "@/features/accounts/hooks/use-select-account";

enum VARIANTS {
  LIST = "LIST",
  IMPORT = "IMPORT",
}

const INITIAL_IMPORT_RESULTS = {
  data: [],
  errors: [],
  meta: [],
};

const TransactionsPage = () => {
    const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
    const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);
  
    const [AccountDialog, confirm] = useSelectAccount();
    const newTransaction = useNewTransaction();
    const createTransactions = useBulkCreateTransactions();
    const deleteTransactions = useBulkDeleteTransactions();
    const transactionsQuery = useGetTransactions();
    const transactions = transactionsQuery.data || [];
  
    const onUpload = (results: typeof INITIAL_IMPORT_RESULTS) => {
      setImportResults(results);
      setVariant(VARIANTS.IMPORT);
    };
  
    const onCancelImport = () => {
      setImportResults(INITIAL_IMPORT_RESULTS);
      setVariant(VARIANTS.LIST);
    };
  
    const onSubmitImport = async (
      values: (typeof transactionSchema.$inferInsert)[]
    ) => {
      const accountId = await confirm();
  
      if (!accountId) {
        return toast.error("Please select an account to continue.");
      }
  
      const data = values.map((value) => ({
        ...value,
        accountId: accountId as string,
      }));
  
      createTransactions.mutate(data, {
        onSuccess: () => {
          onCancelImport();
        },
      });
    };
  
    const isDisabled =
      transactionsQuery.isLoading || deleteTransactions.isPending;
  
    if (transactionsQuery.isLoading) {
      return (
        <div className="mx-auto -mt-6 w-full max-w-screen-2xl pb-10">
          <Card className="border-none drop-shadow-sm">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
  
            <CardContent>
              <div className="flex h-[500px] w-full items-center justify-center">
                <Loader2 className="size-6 animate-spin text-slate-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  
    if (variant === VARIANTS.IMPORT) {
      return (
        <>
          <AccountDialog />
          <ImportCard
            data={importResults.data}
            onCancel={onCancelImport}
            onSubmit={onSubmitImport} 
          /> 
          <div>This is a screen for import</div>
        </>
      );
    }
  

    if(transactionsQuery.isLoading){
        return (
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
                <Card className="border-none drop-shadow-sm">
                    <CardHeader>
                        <Skeleton h-8 w-48/>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[500px] w-full flex items-center justify-center">
                            <Loader2 className="size-6 text-slate-300 animate-spin"/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
            <Card className="border-none drop-shadow-sm">
                <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="text-xl line-clamp-1">
                        Transactions History
                  </CardTitle>

                    <div className="flex flex-col items-center gap-x-2 gap-y-2 lg:flex-row">
                      <Button
                        size="sm"
                        onClick={newTransaction.onOpen}
                        className="w-full lg:w-auto"
                      >
                        <Plus className="mr-2 size-4" /> Add new
                      </Button>
                      <UploadButton onUpload={onUpload} />
                    </div>
                  </CardHeader>

                <CardContent>
                <DataTable 
                filterKey="payee"
                columns={columns} 
                data={transactions} 
                onDelete={(row) => {
                    const ids = row.map((r)=> r.original.id);
                    deleteTransactions.mutate({ ids });
                }}
                disabled={isDisabled}
                />
                </CardContent>
            </Card>
        </div>
    )
}
export default TransactionsPage;