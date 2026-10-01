import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPES, FIELD_TYPE_LABELS, newField } from "@/lib/formFields";
import type { FormField, FormFieldType } from "@/types";

interface FormFieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

// Lets an admin build the registration form for one event: add, remove and
// reorder questions, choose their type, and mark them required.
export function FormFieldsEditor({ fields, onChange }: FormFieldsEditorProps) {
  const update = (index: number, patch: Partial<FormField>) =>
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const changeType = (index: number, type: FormFieldType) => {
    const field = fields[index];
    update(index, {
      type,
      // Dropdowns need options; other types don't keep any.
      options: type === "select" ? (field.options?.length ? field.options : [""]) : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-12">
      {/* Always asked; shown so the admin can see the whole form. */}
      {["Full name", "Email"].map((label) => (
        <div
          key={label}
          className="flex items-center gap-12 rounded-input border border-graphite px-12 py-8 text-body-sm text-ash-gray"
        >
          <Lock className="h-16 w-16 shrink-0 text-steel-gray" aria-hidden="true" />
          <span className="text-ghost-white">{label}</span>
          <span className="ml-auto text-caption text-steel-gray">Always asked · required</span>
        </div>
      ))}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-12 rounded-card border border-graphite p-16"
        >
          <div className="flex flex-col gap-12 md:flex-row md:items-center">
            <Input
              aria-label={`Question ${index + 1} label`}
              placeholder="Question, e.g. Department"
              value={field.label}
              onChange={(e) => update(index, { label: e.target.value })}
              className="md:flex-1"
            />
            <div className="md:w-[180px]">
              <Select value={field.type} onValueChange={(v) => changeType(index, v as FormFieldType)}>
                <SelectTrigger aria-label={`Question ${index + 1} type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FIELD_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {field.type === "select" && (
            <div className="flex flex-col gap-8">
              <label htmlFor={`opts-${field.id}`} className="text-caption text-steel-gray">
                Options (one per line)
              </label>
              <Textarea
                id={`opts-${field.id}`}
                className="min-h-[88px]"
                value={(field.options ?? []).join("\n")}
                onChange={(e) => update(index, { options: e.target.value.split("\n") })}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-12">
            <label className="flex cursor-pointer items-center gap-8 text-body-sm text-ghost-white">
              <input
                type="checkbox"
                className="h-16 w-16 cursor-pointer accent-lavender-pulse"
                checked={field.required}
                onChange={(e) => update(index, { required: e.target.checked })}
              />
              Required
            </label>

            <div className="flex items-center gap-8">
              <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="h-16 w-16" aria-hidden="true" />
              </IconButton>
              <IconButton
                label="Move down"
                disabled={index === fields.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-16 w-16" aria-hidden="true" />
              </IconButton>
              <IconButton label="Remove question" onClick={() => remove(index)}>
                <Trash2 className="h-16 w-16" aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outlined"
        className="w-fit"
        onClick={() => onChange([...fields, newField("text")])}
      >
        <Plus className="mr-8 h-16 w-16" aria-hidden="true" />
        Add question
      </Button>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-32 w-32 items-center justify-center rounded-input border border-graphite text-ash-gray transition-colors duration-200 hover:border-steel-gray hover:text-ghost-white disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
