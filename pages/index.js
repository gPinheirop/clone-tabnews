import DefaultLayout from "interface/DefaultLayout";

function Home() {
  return (
    <>
      <DefaultLayout
        metadata={{
          description: "Este projeto se resume a um clone do tabnews.com.br",
        }}
      >
        <h1>oi, beleza?</h1>
      </DefaultLayout>
    </>
  );
}

export default Home;
