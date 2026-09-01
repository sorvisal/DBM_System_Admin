"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";

export default function StyleGuidePage() {
  const { theme, toggleTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectVal, setSelectVal] = useState("");

  const colorSwatches = [
    { name: "Primary", light: "#2563EB", dark: "#3B82F6" },
    { name: "Success", light: "#10B981", dark: "#34D399" },
    { name: "Warning", light: "#F59E0B", dark: "#FBBF24" },
    { name: "Danger", light: "#EF4444", dark: "#F87171" },
    { name: "Info", light: "#3B82F6", dark: "#60A5FA" },
    { name: "Bg Primary", light: "#F8FAFC", dark: "#0F172A" },
    { name: "Surface", light: "#FFFFFF", dark: "#1E293B" },
    { name: "Border", light: "#E2E8F0", dark: "#334155" },
    { name: "Text Primary", light: "#0F172A", dark: "#F8FAFC" },
    { name: "Text Muted", light: "#94A3B8", dark: "#64748B" },
  ];

  const statusBadges = [
    { label: "Pending", variant: "secondary" as const },
    { label: "Confirmed", variant: "default" as const },
    { label: "Delivering", variant: "outline" as const },
    { label: "Completed", variant: "default" as const },
    { label: "Cancelled", variant: "destructive" as const },
  ];

  const tableRows = [
    { id: "ORD-001", customer: "Sokha Trading", total: "$1,250.00", status: "Confirmed", date: "2024-01-15" },
    { id: "ORD-002", customer: "Maly Store", total: "$840.00", status: "Pending", date: "2024-01-14" },
    { id: "ORD-003", customer: "Dara Electronics", total: "$2,100.00", status: "Delivering", date: "2024-01-13" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Design System</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">DBM shared tokens — web &amp; mobile</p>
        </div>
        <Button variant="secondary" size="sm" onClick={toggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>

      {/* Colors */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {colorSwatches.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="h-12 rounded-lg" style={{ background: theme === "dark" ? c.dark : c.light }} />
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.name}</div>
              <div className="text-xs text-slate-400 mono">{theme === "dark" ? c.dark : c.light}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Typography</h2>
        <div className="space-y-2 text-slate-700 dark:text-slate-300">
          <div className="flex items-baseline gap-4"><span className="text-3xl font-bold w-24">Heading 1</span><span className="text-xs text-slate-400">32px / bold</span></div>
          <div className="flex items-baseline gap-4"><span className="text-2xl font-semibold w-24">Heading 2</span><span className="text-xs text-slate-400">24px / semibold</span></div>
          <div className="flex items-baseline gap-4"><span className="text-xl font-medium w-24">Heading 3</span><span className="text-xs text-slate-400">20px / medium</span></div>
          <div className="flex items-baseline gap-4"><span className="text-base font-normal w-24">Body</span><span className="text-xs text-slate-400">16px / regular</span></div>
          <div className="flex items-baseline gap-4"><span className="text-sm font-normal w-24">Small</span><span className="text-xs text-slate-400">14px / regular</span></div>
          <div className="flex items-baseline gap-4"><span className="text-xs font-medium w-24">Caption</span><span className="text-xs text-slate-400">12px / medium</span></div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Buttons</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button isLoading>Loading</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          </Button>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Inputs &amp; Selects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default</label>
            <Input placeholder="Enter text..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">With value</label>
            <Input defaultValue="Existing value" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Error</label>
            <Input placeholder="Invalid input..." className="border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400" />
            <p className="text-xs text-red-500">This field is required</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select</label>
            <Select value={selectVal} onChange={setSelectVal}>
              <option value="">Select option...</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Textarea</label>
            <Textarea placeholder="Enter description..." rows={3} />
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Badges &amp; Status Pills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {statusBadges.map((b) => (
            <Badge key={b.label} variant={b.variant}>{b.label}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Pending</Badge>
          <Badge variant="secondary">Confirmed</Badge>
          <Badge variant="outline">Delivering</Badge>
          <Badge variant="destructive">Cancelled</Badge>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>A basic card with header and description.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">Card body content goes here. Use this for stat displays or information panels.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>With Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Card with action buttons in the footer.</p>
              <div className="flex gap-2">
                <Button size="sm">View Details</Button>
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Table</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono font-medium">{row.id}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell className="text-right font-mono">{row.total}</TableCell>
                <TableCell><Badge variant={row.status === "Confirmed" ? "default" : row.status === "Cancelled" ? "destructive" : "secondary"}>{row.status}</Badge></TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Skeleton */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Skeleton Loading</h2>
        <div className="space-y-3 max-w-md">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Dialog</h2>
        <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Confirm Action"
          description="Are you sure you want to proceed? This action cannot be undone."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setDialogOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">Additional confirmation content goes here.</p>
        </Dialog>
      </section>

      {/* Avatar */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Avatar</h2>
        <div className="flex gap-3 items-center">
          <Avatar fallback="JD" className="w-10 h-10 text-sm" />
          <Avatar fallback="AK" className="w-8 h-8 text-xs bg-purple-600" />
          <Avatar fallback="?" className="w-12 h-12 text-base bg-emerald-600" />
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Spacing Scale</h2>
        <div className="flex items-end gap-2">
          {[4, 8, 12, 16, 24, 32, 48].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="w-6 bg-blue-500" style={{ height: s }} />
              <span className="text-xs text-slate-500 dark:text-slate-400 mono">{s}px</span>
            </div>
          ))}
        </div>
      </section>

      {/* Empty State */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Empty State Pattern</h2>
        <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center max-w-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-slate-300 dark:text-slate-600">
            <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">No items found</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create your first item to get started.</p>
          <Button size="sm" className="mt-4">Create Item</Button>
        </div>
      </section>

      {/* Radius */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Border Radius</h2>
        <div className="flex gap-4 items-end">
          {[{ label: "sm (4px)", r: 4 }, { label: "md (6px)", r: 6 }, { label: "lg (8px)", r: 8 }, { label: "xl (12px)", r: 12 }, { label: "full", r: 9999 }].map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-500" style={{ borderRadius: r.r }} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{r.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
