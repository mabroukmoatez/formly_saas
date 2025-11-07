import { SearchIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Input } from "../../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";

const invoiceData = [
  {
    id: "25-10-164",
    date: "05/10/25",
    type: "Particulier",
    client: "Nom Clien A",
    montantHT: "30.000 $",
    montantTVA: "36.000 $",
    montantTTC: "36.000 $",
    status: "unpaid",
  },
  {
    id: "25-10-164",
    date: "05/10/25",
    type: "Particulier",
    client: "Nom Clien A",
    montantHT: "30.000 $",
    montantTVA: "36.000 $",
    montantTTC: "36.000 $",
    status: "paid",
  },
  {
    id: "25-10-164",
    date: "05/10/25",
    type: "Particulier",
    client: "Nom Clien A",
    montantHT: "30.000 $",
    montantTVA: "36.000 $",
    montantTTC: "36.000 $",
    status: "paid",
  },
  {
    id: "25-10-164",
    date: "05/10/25",
    type: "Particulier",
    client: "Nom Clien A",
    montantHT: "30.000 $",
    montantTVA: "36.000 $",
    montantTTC: "36.000 $",
    status: "paid",
  },
  {
    id: "25-10-164",
    date: "05/10/25",
    type: "Particulier",
    client: "Nom Clien A",
    montantHT: "30.000 $",
    montantTVA: "36.000 $",
    montantTTC: "36.000 $",
    status: "paid",
  },
  {
    id: "25-10-164",
    date: "05/10/25",
    type: "Particulier",
    client: "Nom Clien A",
    montantHT: "30.000 $",
    montantTVA: "36.000 $",
    montantTTC: "36.000 $",
    status: "paid",
  },
];

const tableHeaders = [
  { label: "N°", sortable: true },
  { label: "Date", sortable: true },
  { label: "Type", sortable: true },
  { label: "Client", sortable: true },
  { label: "Montant HT", sortable: true },
  { label: "Montant TVA", sortable: true },
  { label: "Montant TTC", sortable: true },
  { label: "Statut", sortable: true },
  { label: "Actions", sortable: false },
];

export const InvoiceTableSection = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full px-6 py-6 flex-1 min-h-0 overflow-hidden">
      <section className="flex flex-col w-full items-end gap-5 flex-1 min-h-0">
      <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        <CardContent className="flex items-center justify-between p-[21px]">
          <h1 className="font-heading font-[number:var(--heading-font-weight)] text-[#19294a] text-[length:var(--heading-font-size)] tracking-[var(--heading-letter-spacing)] leading-[var(--heading-line-height)] [font-style:var(--heading-font-style)]">
            Facture
          </h1>

          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              className="h-auto gap-4 px-[19px] py-2.5 bg-[#ba7fff26] rounded-[10px] hover:bg-[#ba7fff40] transition-colors"
            >
              <img
                className="w-[15.29px] h-[15.29px]"
                alt="Vector"
                src="/assets/icons/plus.svg"
              />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[#ba7fff] text-[17px]">
                Importer Une Facture
              </span>
            </Button>

            <Button
              variant="ghost"
              className="h-auto gap-4 px-[19px] py-2.5 bg-[#e5f3ff] rounded-[10px] hover:bg-[#d0e7ff] transition-colors"
            >
              <img
                className="w-[15.29px] h-[15.29px]"
                alt="Vector"
                src="/assets/icons/plus.svg"
              />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[17px]">
                Créez Une Facture
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full border-[#e2e2ea] rounded-[18px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <CardContent className="flex flex-col gap-[26px] p-[21px]">
          <div className="flex items-center justify-between w-full">
            <div className="relative w-[461px]">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[22.22px] h-[22.22px] text-[#698eac]" />
              <Input
                placeholder="Rechercher Par Client"
                className="h-10 pl-[50px] bg-[#e8f0f7] border-0 rounded-[10px] [font-family:'Poppins',Helvetica] font-medium text-[#698eac] text-[13px] placeholder:text-[#698eac]"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="h-10 gap-2.5 px-4 py-2.5 bg-[#f5f4f4] rounded-[10px] hover:bg-[#e5e4e4] transition-colors"
              >
                <img
                  className="w-5 h-5"
                  alt="Layer"
                  src="/assets/icons/filter.png"
                />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#7e8ca9] text-[13px]">
                  Trier
                </span>
                <img
                  className="w-[11px] h-[6.51px]"
                  alt="Vector"
                  src="/assets/icons/dropdown.svg"
                />
              </Button>

              <Button
                variant="outline"
                className="h-10 gap-2.5 px-4 py-2.5 rounded-[10px] border-dashed border-[#6a90b9] hover:bg-[#6a90b910] transition-colors"
              >
                <img
                  className="w-5 h-5"
                  alt="Layer"
                  src="/assets/icons/export.png"
                />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#698eac] text-[13px]">
                  Export Excel
                </span>
              </Button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#e2e2ea] hover:bg-transparent">
                  <TableHead className="w-[50px]">
                    <div className="flex items-center justify-center">
                      <Checkbox className="w-5 h-5 rounded-md border-[#007aff] data-[state=checked]:bg-[#e5f3ff] data-[state=checked]:border-[#007aff]" />
                    </div>
                  </TableHead>
                  {tableHeaders.map((header, index) => (
                    <TableHead key={index} className="text-center">
                      <button className="flex items-center justify-center gap-2.5 w-full [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px] hover:text-[#007aff] transition-colors">
                        <span
                          className={
                            header.label === "Date" ? "text-[#007aff]" : ""
                          }
                        >
                          {header.label}
                        </span>
                        {header.sortable && (
                          <img
                            className="w-[12.45px] h-[12.45px]"
                            alt="Vuesax linear arrow"
                            src="/assets/icons/sort-arrow.svg"
                          />
                        )}
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceData.map((invoice, index) => (
                  <TableRow
                    key={index}
                    className="border-b border-[#e2e2ea] hover:bg-[#f9fafb] transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Checkbox className="w-5 h-5 rounded-md border-[#6a90b9]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                        {invoice.id}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#007aff] text-[15px]">
                        {invoice.date}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                        {invoice.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                        {invoice.client}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-[#e8f0f7] text-[#19294a] hover:bg-[#e8f0f7] rounded-[35px] px-[15px] py-[3px] [font-family:'Urbanist',Helvetica] font-medium text-[15px]"
                      >
                        {invoice.montantHT}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-[#e8f0f7] text-[#19294a] hover:bg-[#e8f0f7] rounded-[35px] px-[15px] py-[3px] [font-family:'Urbanist',Helvetica] font-medium text-[15px]"
                      >
                        {invoice.montantTVA}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-[#e8f0f7] text-[#19294a] hover:bg-[#e8f0f7] rounded-[35px] px-[15px] py-[3px] [font-family:'Urbanist',Helvetica] font-medium text-[15px]"
                      >
                        {invoice.montantTTC}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`rounded-[35px] px-[18px] py-[3px] [font-family:'Urbanist',Helvetica] font-medium text-[15px] ${
                          invoice.status === "unpaid"
                            ? "bg-[#fe2f4040] text-[#fe2f40] hover:bg-[#fe2f4040]"
                            : "bg-[#25c9b540] text-[#25c9b5] hover:bg-[#25c9b540]"
                        }`}
                      >
                        {invoice.status === "unpaid" ? "Impayée" : "Payée"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-3.5">
                        <button className="transition-transform hover:scale-110">
                          <img
                            className="w-[30.67px] h-[30.67px]"
                            alt="Frame"
                            src="/assets/icons/favorite.svg"
                          />
                        </button>
                        <button className="transition-transform hover:scale-110">
                          <img
                            className="w-[30.67px] h-[30.67px]"
                            alt="Frame"
                            src="/assets/icons/more.svg"
                          />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="w-[369px] bg-[#e8f0f7] rounded-[10px] border-0 animate-fade-in opacity-0 [--animation-delay:600ms]">
        <CardContent className="flex flex-col gap-[11.76px] p-[17.65px_23.53px]">
          <div className="flex items-center justify-between pt-1 pb-[11px] border-b border-[#007aff0f]">
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#19294a] text-sm">
              Total HT
            </span>
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#19294a] text-sm">
              300,00 €
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 pb-[11px] border-b border-[#007aff0f]">
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#19294a] text-sm">
              TVA
            </span>
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#19294a] text-sm">
              320.6 €
            </span>
          </div>

          <div className="flex items-center justify-between py-[4.75px]">
            <span className="[font-family:'Inter',Helvetica] font-semibold text-[#007aff] text-[18.7px]">
              Total TTC
            </span>
            <span className="[font-family:'Inter',Helvetica] font-semibold text-[#007aff] text-[18.7px]">
              303,200,0 €
            </span>
          </div>
        </CardContent>
      </Card>
      </section>
    </div>
  );
};
