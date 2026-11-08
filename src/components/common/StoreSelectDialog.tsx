"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StoreLinkOption } from '@/lib/sso';
import { Building2, ExternalLink } from 'lucide-react';

interface StoreSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: readonly StoreLinkOption[];
}

export function StoreSelectDialog({ isOpen, onClose, title, options }: StoreSelectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-orange-100 shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Building2 className="h-5 w-5 text-[#cf2e2e]" />
            {title} - 店舗選択
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            閲覧・操作を行う対象の店舗を選択してください。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2.5 pt-4">
          {options.map((opt) => {
            const isDisabled = !opt.url || opt.url === '#';
            return (
              <Button
                key={opt.name}
                variant="outline"
                disabled={isDisabled}
                asChild={!isDisabled}
                className={`h-12 text-sm font-semibold rounded-xl border flex items-center justify-between px-3 ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed bg-slate-50' 
                    : 'hover:border-[#cf2e2e] hover:text-[#cf2e2e] hover:bg-orange-50/50 shadow-sm'
                }`}
              >
                {!isDisabled ? (
                  <a href={opt.url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
                    <span>{opt.name}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span>{opt.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">未設定</span>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
