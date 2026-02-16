import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Heading,
  Table,
  Tooltip,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { sdk } from "~/lib/sdk";
import { Fitment } from "~/modules/fitment/schema";


const ProductFitmentsWidget = () => {
  const navigate = useNavigate();
  const params = useParams();
  const productId = params.id;
  const queryClient = useQueryClient();

  // Fetch fitments for this product
  const { data, isLoading, error } = useQuery({
    queryKey: ["product-fitments", productId],
    queryFn: async () => {
      const response = await sdk.client.fetch(
        `/admin/products/${productId}/fitments`,
      );
      return response as { fitments: Fitment[] };
    },
  });

  // Mutation to unlink a fitment
  const unlinkMutation = useMutation({
    mutationFn: async (fitmentId: string) => {
      return sdk.client.fetch(
        `/admin/products/${productId}/fitments/${fitmentId}`,
        {
          method: "DELETE",
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-fitments", productId],
      });
      toast.success("Fitment unlinked successfully");
    },
    onError: () => {
      toast.error("Failed to unlink fitment");
    },
  });

  const fitments = data?.fitments || [];

  return (
    <Container className="p-0">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col divide-y">
          <div className="px-6 py-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <Heading>Fitments</Heading>
            <Button
              variant="secondary"
              size="small"
              className="ml-auto"
              onClick={() => navigate(`/products/${productId}/fitment/create`)}
            >
              Create
            </Button>
          </div>

          <div className="px-6 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-ui-fg-subtle">Loading fitments...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-ui-fg-error">
                  Failed to load fitments
                </p>
              </div>
            )}

            {!isLoading && !error && fitments.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-ui-fg-subtle">
                  No fitments linked to this product
                </p>
              </div>
            )}

            {!isLoading && !error && fitments.length > 0 && (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Make</Table.HeaderCell>
                    <Table.HeaderCell>Model</Table.HeaderCell>
                    <Table.HeaderCell>Years</Table.HeaderCell>
                    <Table.HeaderCell>Engine</Table.HeaderCell>
                    <Table.HeaderCell>Body Style</Table.HeaderCell>
                    <Table.HeaderCell>Drive</Table.HeaderCell>
                    <Table.HeaderCell>Transmission</Table.HeaderCell>
                    <Table.HeaderCell></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {fitments.map((fitment) => (
                    <Table.Row key={fitment.id}>
                      <Table.Cell>{fitment.model.make.name}</Table.Cell>
                      <Table.Cell>{fitment.model.name}</Table.Cell>
                      <Table.Cell>
                        {fitment.year_start} - {fitment.year_end}
                      </Table.Cell>
                      <Table.Cell>
                        {fitment.engine.size}L {fitment.engine.type}{" "}
                        {fitment.engine.fuel}
                        {fitment.engine.tech && ` (${fitment.engine.tech})`}
                      </Table.Cell>
                      <Table.Cell>{fitment.body_style}</Table.Cell>
                      <Table.Cell>{fitment.drive}</Table.Cell>
                      <Table.Cell>{fitment.transmission}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip content="Unlink fitment">
                            <Button
                              variant="transparent"
                              size="small"
                              onClick={() => unlinkMutation.mutate(fitment.id)}
                              disabled={unlinkMutation.isPending}
                            >
                              Unlink
                            </Button>
                          </Tooltip>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductFitmentsWidget;
