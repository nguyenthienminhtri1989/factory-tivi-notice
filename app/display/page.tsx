import DisplayClient from "./DisplayClient";

type DisplayPageProps = {
  searchParams: Promise<{
    group?: string;
    device?: string;
  }>;
};

export default async function DisplayPage({ searchParams }: DisplayPageProps) {
  const params = await searchParams;
  return <DisplayClient groupCode={params.group || "xuong-a"} deviceCode={params.device || ""} />;
}
