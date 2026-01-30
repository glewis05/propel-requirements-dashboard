import {
  HelpCircle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bug,
  MessageCircle,
  Shield,
  FileText,
} from "lucide-react"

export default function TesterHelpPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Testing Help</h1>
        <p className="text-muted-foreground mt-1">
          Guide to executing tests and reporting defects
        </p>
      </div>

      {/* Quick Start */}
      <section className="rounded-lg bg-card border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Quick Start
        </h2>
        <ol className="space-y-3 text-sm text-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">1</span>
            <span>Go to <strong>My Tests</strong> to see your assigned test cases</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">2</span>
            <span>Click <strong>Start</strong> on a test to begin execution</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">3</span>
            <span>Execute each step and record the result (Pass, Fail, Blocked, or Skip)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">4</span>
            <span>When all steps are complete, mark the overall test as Passed, Failed, or Blocked</span>
          </li>
        </ol>
      </section>

      {/* Test Statuses */}
      <section className="rounded-lg bg-card border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Understanding Test Statuses
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatusCard
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
            title="Passed"
            description="All steps executed as expected. The feature works correctly."
            color="border-success/20 bg-success/5"
          />
          <StatusCard
            icon={<XCircle className="h-5 w-5 text-destructive" />}
            title="Failed"
            description="One or more steps did not produce the expected result. A defect should be logged."
            color="border-destructive/20 bg-destructive/5"
          />
          <StatusCard
            icon={<AlertTriangle className="h-5 w-5 text-warning" />}
            title="Blocked"
            description="Testing cannot proceed due to an external issue (environment, dependencies, etc.)."
            color="border-warning/20 bg-warning/5"
          />
          <StatusCard
            icon={<Shield className="h-5 w-5 text-emerald-600" />}
            title="Verified"
            description="A manager has reviewed and confirmed the test results."
            color="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
          />
        </div>
      </section>

      {/* Reporting Defects */}
      <section className="rounded-lg bg-card border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bug className="h-5 w-5 text-destructive" />
          Reporting Defects
        </h2>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            When a test step fails, you should report a defect. Good defect reports include:
          </p>
          <ul className="space-y-2 text-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <strong>Clear title</strong> - Brief description of what went wrong
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <strong>Steps to reproduce</strong> - Exact steps to recreate the issue
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <strong>Expected result</strong> - What should have happened
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <strong>Actual result</strong> - What actually happened
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <strong>Severity</strong> - How critical is this issue?
            </li>
          </ul>

          <div className="mt-4 p-4 rounded-md bg-muted/50">
            <h3 className="font-medium text-foreground mb-2">Defect Severity Levels</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">Critical</span>
                <span className="text-muted-foreground">System crash, data loss, security issue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning">High</span>
                <span className="text-muted-foreground">Major feature broken, no workaround</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">Medium</span>
                <span className="text-muted-foreground">Feature issue with workaround available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">Low</span>
                <span className="text-muted-foreground">Minor issue, cosmetic, nice-to-have</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="rounded-lg bg-card border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Testing Tips
        </h2>
        <ul className="space-y-3 text-sm text-foreground">
          <li className="flex gap-2">
            <span className="text-success">✓</span>
            Read the test case description and preconditions before starting
          </li>
          <li className="flex gap-2">
            <span className="text-success">✓</span>
            Follow each step exactly as written
          </li>
          <li className="flex gap-2">
            <span className="text-success">✓</span>
            Document actual results, especially when they differ from expected
          </li>
          <li className="flex gap-2">
            <span className="text-success">✓</span>
            Take screenshots when reporting defects (if possible)
          </li>
          <li className="flex gap-2">
            <span className="text-success">✓</span>
            If blocked, note what&apos;s preventing you from continuing
          </li>
          <li className="flex gap-2">
            <span className="text-success">✓</span>
            Complete tests at your own pace - you can pause and resume
          </li>
        </ul>
      </section>

      {/* Support */}
      <section className="rounded-lg bg-primary/5 border border-primary/20 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Need Help?
        </h2>
        <p className="text-sm text-muted-foreground">
          If you encounter issues or have questions about testing, please contact your UAT Manager
          or reach out to the project team. We&apos;re here to help ensure testing goes smoothly.
        </p>
      </section>
    </div>
  )
}

function StatusCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-medium text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
