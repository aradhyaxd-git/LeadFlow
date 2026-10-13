import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCreateLead } from "./hooks";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotify: (type: "success" | "error", text: string) => void;
}

export function AddLeadDialog({
  open,
  onOpenChange,
  onNotify,
}: AddLeadDialogProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const createLeadMutation = useCreateLead();

  const resetForm = () => {
    setName("");
    setCompany("");
    setPhone("");
    setNameError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Full Name is required.");
      return;
    }

    createLeadMutation.mutate(
      {
        name: trimmedName,
        company: company.trim() || null,
        phone: phone.trim() || null,
      },
      {
        onSuccess: (created) => {
          onNotify("success", `Added lead "${created.name}"`);
          resetForm();
          onOpenChange(false);
        },
        onError: (err) => {
          onNotify(
            "error",
            err instanceof Error ? err.message : "Failed to create lead"
          );
        },
      }
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <Dialog.Title className="text-lg font-bold text-slate-900">
              Add New Lead
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close modal"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <label
                htmlFor="lead-full-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lead-full-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g., John Doe"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              {nameError && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lead-company"
                className="block text-xs font-semibold text-slate-700"
              >
                Company{" "}
                <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                id="lead-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Stark Industries"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="lead-phone"
                className="block text-xs font-semibold text-slate-700"
              >
                Phone{" "}
                <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 555-0123"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {createLeadMutation.isPending ? "Saving..." : "Save Lead"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
