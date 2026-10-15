"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Transaction, TransactionAttachment } from "@/types/finance";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

function formatFileSize(size: number | null) {
  if (!size) return "Unknown size";
  return size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

interface ReceiptManagerProps {
  userId: string;
  transaction: Transaction;
  attachments: TransactionAttachment[];
  onChanged: (attachments: TransactionAttachment[]) => void;
  disabled?: boolean;
  onClose?: () => void;
}

export function ReceiptManager({ userId, transaction, attachments, onChanged, disabled = false, onClose }: ReceiptManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [deleting, setDeleting] = useState<TransactionAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const file = files[0];
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Unsupported receipt format", description: "Use a JPG, PNG, WEBP, HEIC, or PDF file.", variant: "warning" });
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      toast({ title: "Receipt is too large", description: "Receipt files must be smaller than 5 MB.", variant: "warning" });
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
    const storagePath = `${userId}/${transaction.id}/${crypto.randomUUID()}-${safeName}`;
    try {
      const { error: uploadError } = await supabase.storage.from("receipts").upload(storagePath, file, { cacheControl: "3600", contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data, error: insertError } = await supabase.from("transaction_attachments").insert({
        user_id: userId,
        transaction_id: transaction.id,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        captured_at: new Date().toISOString(),
        receipt_metadata: {},
      }).select("id, transaction_id, storage_path, file_name, mime_type, file_size, captured_at, merchant_name, receipt_total, receipt_metadata, created_at").single();
      if (insertError) {
        await supabase.storage.from("receipts").remove([storagePath]);
        throw insertError;
      }
      onChanged([...attachments, {
        id: data.id,
        transaction_id: data.transaction_id,
        storage_path: data.storage_path,
        file_name: data.file_name,
        mime_type: data.mime_type,
        file_size: data.file_size,
        captured_at: data.captured_at,
        merchant_name: data.merchant_name,
        receipt_total: data.receipt_total,
        receipt_metadata: data.receipt_metadata ?? {},
        created_at: data.created_at,
      }]);
      toast({ title: "Receipt attached", description: `${file.name} is saved with this transaction.`, variant: "success" });
    } catch (uploadError) {
      toast({ title: "Could not attach receipt", description: uploadError instanceof Error ? uploadError.message : "Please try again.", variant: "danger" });
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handlePreview = async (attachment: TransactionAttachment) => {
    const { data, error } = await createClient().storage.from("receipts").createSignedUrl(attachment.storage_path, 60 * 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Could not open receipt", description: error?.message ?? "The receipt URL could not be created.", variant: "danger" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    const supabase = createClient();
    try {
      const { error: storageError } = await supabase.storage.from("receipts").remove([deleting.storage_path]);
      if (storageError) throw storageError;
      const { error: deleteError } = await supabase.from("transaction_attachments").delete().eq("id", deleting.id).eq("user_id", userId);
      if (deleteError) throw deleteError;
      onChanged(attachments.filter((attachment) => attachment.id !== deleting.id));
      setDeleting(null);
      toast({ title: "Receipt removed", description: `${deleting.file_name} was removed from this transaction.`, variant: "success" });
    } catch (deleteError) {
      toast({ title: "Could not remove receipt", description: deleteError instanceof Error ? deleteError.message : "Please try again.", variant: "danger" });
    } finally {
      setIsDeleting(false);
    }
  };

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">Receipts and attachments</p><p className="mt-1 text-sm text-muted-foreground">Keep invoices and proof of purchase with this transaction. Maximum file size is 5 MB.</p></div>{onClose && <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close receipt manager"><X className="h-4 w-4" /></Button>}</div>
    <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={(event) => void handleFiles(event.target.files)} />
    <button type="button" className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/[0.05] p-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/[0.09] disabled:cursor-not-allowed disabled:opacity-60" onClick={() => inputRef.current?.click()} disabled={disabled || isUploading}><span className="rounded-2xl bg-primary/15 p-3 text-primary">{isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}</span><span className="mt-3 font-semibold">{isUploading ? "Uploading receipt..." : "Upload a receipt"}</span><span className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, or HEIC</span></button>
    {attachments.length === 0 ? <div className="rounded-xl border border-dashed border-border/70 p-5 text-center text-sm text-muted-foreground"><Paperclip className="mx-auto mb-2 h-5 w-5" />No receipts attached yet.</div> : <div className="space-y-2">{attachments.map((attachment) => <div key={attachment.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3"><span className="rounded-lg bg-secondary p-2 text-info">{attachment.mime_type === "application/pdf" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</span><button type="button" className="min-w-0 flex-1 text-left" onClick={() => void handlePreview(attachment)}><span className="block truncate text-sm font-medium hover:text-primary">{attachment.file_name}</span><span className="mt-1 block text-xs text-muted-foreground">{formatFileSize(attachment.file_size)} · Click to preview</span></button><Badge variant="outline" className="hidden border-info/30 text-info sm:inline-flex">Receipt</Badge><Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(attachment)} disabled={disabled || isUploading} aria-label={`Remove ${attachment.file_name}`}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !isDeleting) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this receipt?</AlertDialogTitle><AlertDialogDescription>{deleting?.file_name} will be removed from storage and detached from this transaction.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); void handleDelete(); }} disabled={isDeleting}>{isDeleting ? "Removing..." : "Remove receipt"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
