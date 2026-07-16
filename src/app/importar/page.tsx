import { hojeLocal } from "@/lib/datas";
import ImportarCSV from "@/components/ImportarCSV";

export const dynamic = "force-dynamic";

export default function PaginaImportar() {
  const hoje = hojeLocal();
  return <ImportarCSV anoAtual={hoje.ano} mesAtual={hoje.mes} />;
}
