import { getCoreRowModel, useReactTable, flexRender, getPaginationRowModel} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import {useMemo} from "react";
interface ReactTableProps<T extends object> {
    data: T[];
    columns: ColumnDef<T>[];
    showFooter: boolean
    showNavigation?: boolean;
}

type Item = {
    name: string;
    price: number;
    quantity: number;
}

const dummyData = () => {
    const items = [];
    for (let i = 0; i < 10; i++) {
        items.push({
            id: i,
            name: `Item ${i}`,
            price: 100,
            quantity: 1,
        });
    }
    return items;
}

const AComponentThatUsesTable = () => {
    return (
        <div className="px-10 py-5 md:w-1/2 m-auto">
            <Table data={dummyData()} columns={cols}  showFooter/>
            {/* .... */}
        </div>
    );
};

const cols = useMemo<ColumnDef<Item>[]>(
    () => [
        {
            header: 'Name',
            cell: (row) => row.renderValue(),
            accessorKey: 'name',
        },
        {
            header: 'Price',
            cell: (row) => row.renderValue(),
            accessorKey: 'price',
        },
        {
            header: 'Quantity',
            cell: (row) => row.renderValue(),
            accessorKey: 'quantity',
        },
    ],
    []
);

export const Table = <T extends object>({ data, columns, showFooter = true }: ReactTableProps<T>) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });


    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden p-2">
                        <table className="min-w-full text-center">
                            <thead className="border-b bg-gray-50">
                            {/* ... */}
                            </thead>
                            <tbody>
                            {/* ... */}
                            </tbody>
                            {showFooter ? (
                                <tfoot className="border-t bg-gray-50">
                                {table.getFooterGroups().map((footerGroup) => (
                                    <tr key={footerGroup.id}>
                                        {footerGroup.headers.map((header) => (
                                            <th key={header.id} colSpan={header.colSpan}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.footer, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                                </tfoot>
                            ) : null}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};