import { redirect, notFound } from "next/navigation";
import { getCallData } from "@/actions/call";
import CallRoom from "./_components/CallRoom";
import { toast } from "sonner";

export default async function CallPage({ params }) {
  const { callId } = await params;

  const result = await getCallData(callId);

  if (result.error === "Unauthorized") {
    toast.error("You must be signed in to access this call")
    redirect("/");
  }
  if (result.error === "Call not found") {
    toast.error("This call does not exit")
    notFound();
  }
  if (result.error === "Forbidden") {
    toast.error("you do not have permission to access this call")
    redirect("/");
  }

  
  const { token, isInterviewer, currentUser, booking } = result;

  return (
    <CallRoom
      callId={callId}
      token={token}
      apiKey={process.env.NEXT_PUBLIC_STREAM_API_KEY}
      currentUser={currentUser}
      booking={booking}
      isInterviewer={isInterviewer}
    />
  );
}