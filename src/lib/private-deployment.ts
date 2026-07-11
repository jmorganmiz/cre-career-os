export class PrivateDeploymentRequiredError extends Error {
  constructor() {
    super(
      "Automation Inbox requires a privately protected deployment. Enable Vercel Deployment Protection or equivalent access control, then set CAREEROS_PRIVATE_DEPLOYMENT_ACK=true.",
    );
    this.name = "PrivateDeploymentRequiredError";
  }
}

export function requirePrivateDeploymentAck() {
  if (process.env.CAREEROS_PRIVATE_DEPLOYMENT_ACK === "true") return;
  throw new PrivateDeploymentRequiredError();
}
