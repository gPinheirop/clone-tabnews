import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  return (
    <>
      <h1>Status</h1>
      <div>
        {isLoading
          ? `Carregando...`
          : `Última atualização: ${new Date(data.updated_at).toLocaleString("pt-BR")}`}
      </div>

      <div>{data && JSON.stringify(data.dependencies.database, null, 2)}</div>
    </>
  );
}
