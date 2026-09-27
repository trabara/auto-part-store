import { zodQueryResolve } from "@repo/utils";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useSdk } from "../provider/sdk-provider";
import { useMedusaCrud } from "../context/crud";

type DetailsPageProps = {
  id?: string;
  mount?: string;
  children?: React.ReactNode;
};

const MedusaDetailsPage = ({ id, mount, children }: DetailsPageProps) => {
  const { config, setData } = useMedusaCrud();
  const sdk = useSdk();

  const result = useQuery<Record<string, any>>({
    enabled: !!id,
    queryKey: [config.path],
    queryFn: async ({ signal }) => {
      const result = await sdk.client.fetch<{
        success: boolean;
        data: Record<string, any>;
      }>(`/admin${config.path}/${id}`, {
        method: "GET",
        signal,
        query: {
          fields: zodQueryResolve(config.entitySchema),
        },
      });

      const data = mount ? _.get(result, mount) : result.data;
      setData(data || {});
      return data;
    },
  });

  if (result.isLoading) {
    return <div>Loading...</div>;
  }

  if (result.isError) {
    return <div>Error: {String(result.error)}</div>;
  }

  if (!result.data) {
    return <div>No data found</div>;
  }

  return <>{children}</>;
};

export default MedusaDetailsPage;
