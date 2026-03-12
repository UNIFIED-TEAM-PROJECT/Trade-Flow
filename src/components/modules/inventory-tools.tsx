"use client";

import { FormEvent, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function InventoryTools() {
  const [code, setCode] = useState("BAR-TF-0001");
  const [quantity, setQuantity] = useState("1");
  const [svg, setSvg] = useState<string>("");

  async function generate(event: FormEvent) {
    event.preventDefault();
    const result = await QRCode.toString(code, { type: "svg", width: 180, margin: 1 });
    setSvg(result);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barcode / QR Utility</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={generate}>
          <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Item code" />
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Quantity"
          />
          <Button type="submit">Generate QR</Button>
        </form>
        {svg ? (
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="mb-2 text-sm text-slate-600">Code: {code}</p>
            {/* QR preview is rendered to match printable label workflow in MVP. */}
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
