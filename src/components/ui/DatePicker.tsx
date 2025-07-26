import { ko } from "date-fns/locale";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  value?: string | Date;
  onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [selected, setSelected] = React.useState<Date | undefined>(
    value ? (typeof value === "string" ? new Date(value) : value) : undefined
  );

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={(date) => {
        setSelected(date ?? undefined);
        if (date) {
          onChange(date.toISOString().slice(0, 10));
        }
      }}
      showOutsideDays
      weekStartsOn={0}
      locale={ko}
      modifiersClassNames={{ selected: "bg-primary text-white" }}
      className="rounded-md border bg-background p-2 shadow-sm"
    />
  );
} 