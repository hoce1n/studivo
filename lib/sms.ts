const SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";

type SmsIrVerifyParameter = {
  name: string;
  value: string;
};

type SmsIrVerifyRequest = {
  mobile: string;
  templateId: number;
  parameters: SmsIrVerifyParameter[];
};

type SmsIrVerifySuccessResponse = {
  status: 1;
  message: string;
  data: {
    messageId: number;
    cost: number;
  };
};

type SmsIrErrorResponse = {
  status: number;
  message: string;
};

function getSmsConfig(): { apiKey: string; templateId: number } {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateIdRaw = process.env.SMS_IR_TEMPLATE_ID;

  if (!apiKey || !templateIdRaw) {
    throw new Error("SMS configuration is missing.");
  }

  const templateId = Number(templateIdRaw);
  if (!Number.isFinite(templateId) || templateId <= 0) {
    throw new Error("SMS template ID is invalid.");
  }

  return { apiKey, templateId };
}

function isSmsIrSuccessResponse(
  payload: unknown,
): payload is SmsIrVerifySuccessResponse {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const record = payload as Record<string, unknown>;

  return (
    record.status === 1 &&
    typeof record.data === "object" &&
    record.data !== null &&
    typeof (record.data as Record<string, unknown>).messageId === "number"
  );
}

function isSmsIrErrorResponse(payload: unknown): payload is SmsIrErrorResponse {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const record = payload as Record<string, unknown>;

  return (
    typeof record.status === "number" &&
    typeof record.message === "string"
  );
}

function logSmsFailure(context: string, detail?: string) {
  console.error(
    `[sms] ${context}${detail ? `: ${detail}` : ""}`,
  );
}

export const SMS_SEND_FAILURE_MESSAGE =
  "ارسال پیامک با خطا مواجه شد. لطفاً دوباره تلاش کنید.";

export async function sendVerificationCode(
  mobile: string,
  code: string,
  purpose?: string,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV OTP] ${purpose ?? "verification"} code for ${mobile}: ${code}`);
  }

  const { apiKey, templateId } = getSmsConfig();

  const body: SmsIrVerifyRequest = {
    mobile,
    templateId,
    parameters: [{ name: "CODE", value: code }],
  };

  let response: Response;

  try {
    response = await fetch(SMS_IR_VERIFY_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    logSmsFailure(
      "Failed to reach SMS.ir API",
      error instanceof Error ? error.message : "Network error",
    );
    throw new Error(SMS_SEND_FAILURE_MESSAGE);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    logSmsFailure(
      "SMS.ir API returned non-JSON response",
      `HTTP ${response.status}`,
    );
    throw new Error(SMS_SEND_FAILURE_MESSAGE);
  }

  if (!response.ok) {
    const detail = isSmsIrErrorResponse(payload)
      ? `HTTP ${response.status}, status=${payload.status}`
      : `HTTP ${response.status}`;
    logSmsFailure("SMS.ir API HTTP error", detail);
    throw new Error(SMS_SEND_FAILURE_MESSAGE);
  }

  if (!isSmsIrSuccessResponse(payload)) {
    const detail = isSmsIrErrorResponse(payload)
      ? `status=${payload.status}`
      : "unrecognized response";
    logSmsFailure("SMS.ir API rejected request", detail);
    throw new Error(SMS_SEND_FAILURE_MESSAGE);
  }
}
