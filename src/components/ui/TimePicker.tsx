import React from "react";
import ReactTimePicker from "react-time-picker";
import { cn } from "~/lib/utils";

interface TimePickerProps {
	value?: string;
	onChange: (time: string) => void;
	disabled?: boolean;
	className?: string;
}

export function TimePicker({
	value,
	onChange,
	disabled,
	className,
}: TimePickerProps) {
	const handleChange = (newValue: string | null) => {
		if (newValue) {
			onChange(newValue);
		}
	};

	return (
		<ReactTimePicker
			value={value}
			onChange={handleChange}
			disableClock
			clearIcon={null}
			format="HH:mm"
			className={cn("", className)}
			disabled={disabled}
		/>
	);
}
