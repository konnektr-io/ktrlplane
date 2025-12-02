import { Check } from "lucide-react";
import type { StepConfig } from "../../hooks/useResourceCreationFlow";

interface CreationProgressBarProps {
  steps: StepConfig[];
  currentStepIndex: number;
}

export function CreationProgressBar({
  steps,
  currentStepIndex,
}: CreationProgressBarProps) {
  return (
    <div className="flex items-center mb-8 overflow-x-auto">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <>
            {/* Step Circle and Label */}
            <div
              key={step.id}
              className={`flex items-center ${
                isCurrent
                  ? "text-primary"
                  : isCompleted
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="ml-2 font-medium whitespace-nowrap">
                {step.label}
                {!step.required && (
                  <span className="text-xs ml-1 text-muted-foreground">
                    (Optional)
                  </span>
                )}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 min-w-[2rem] ${
                  isCompleted ? "bg-green-600" : "bg-muted"
                }`}
              />
            )}
          </>
        );
      })}
    </div>
  );
}
