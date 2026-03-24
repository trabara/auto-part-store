import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Container,
  Drawer,
  DropdownMenu,
  Heading,
  IconButton,
  Input,
  Label,
  Textarea,
  toast,
  useToggleState
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UpdateStoreDetailsInput, UpdateStoreDetailsSchema } from "../../../modules/store-details/schema";
import { sdk } from "../../lib/sdk";

import { EllipsisHorizontal, Pencil } from '@medusajs/icons';


export const StoreDetailsForm = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [isDrawerOpen, openDrawer, closeDrawer, toggleDrawer] = useToggleState(false);

  const { data, isLoading } = useQuery<{
    store: { id: string; name: string } & UpdateStoreDetailsInput;
  }>({
    queryFn: () => sdk.client.fetch("/admin/store/details"),
    queryKey: ["store-details"],
  });

  const form = useForm<UpdateStoreDetailsInput>({
    resolver: zodResolver(UpdateStoreDetailsSchema)
  });

  useEffect(() => {
    form.reset({
      logo_url: data?.store?.logo_url,
      map_url: data?.store?.map_url,
      address: data?.store?.address,
      contact_emails: data?.store?.contact_emails || [],
      contact_phone_numbers: data?.store?.contact_phone_numbers || [],
      // social_links: data?.store?.social_links || {
      //   facebook: undefined,
      //   twitter: undefined,
      //   instagram: undefined,
      // },
    });
  }, [data, form]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: UpdateStoreDetailsInput) =>
      sdk.client.fetch("/admin/store/details", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-details"] });
      toast.success(t('store.widget.toast.success'));
      closeDrawer();
    },
    onError: () => {
      toast.error(t('store.widget.toast.error'));
      closeDrawer();
    },
  });

  const handleSubmit = form.handleSubmit(async ({ logo_file, ...restValues }) => {
    if (logo_file) {
      const { files } = await sdk.admin.upload.create({ files: [logo_file] })
      return mutateAsync({ ...restValues, logo_url: files[0].url });
    }
    return mutateAsync(restValues);
  });


  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t('store.widget.title')}</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton variant="transparent">
              <EllipsisHorizontal className="h-4 w-4" />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onSelect={openDrawer} className="gap-x-2 items-center">
              <Pencil width={15} height={15} />
              <span>{t('common.edit')}</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      <div>

        <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
          <p className="font-medium font-sans txt-compact-small">{t('store.field.logo')}</p>
          <p className="font-normal font-sans txt-compact-small">
            {data?.store?.logo_url ? <img src={data.store.logo_url} alt="Store Logo" className="h-16 w-auto rounded object-contain" /> : '-'}
          </p>
        </div>

        <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
          <p className="font-medium font-sans txt-compact-small">{t('store.field.address')}</p>
          <p className="font-normal font-sans txt-compact-small">{data?.store?.address || '-'}</p>
        </div>

        <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
          <p className="font-medium font-sans txt-compact-small">{t('store.field.email')}</p>
          <p className="font-normal font-sans txt-compact-small">{data?.store?.contact_emails?.join(', ') || '-'}</p>
        </div>

        <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
          <p className="font-medium font-sans txt-compact-small">{t('store.field.phone')}</p>
          <p className="font-normal font-sans txt-compact-small">{data?.store?.contact_phone_numbers?.join(', ') || '-'}</p>
        </div>

        <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
          <p className="font-medium font-sans txt-compact-small">{t('store.field.map_url')}</p>
          <p className="font-normal font-sans txt-compact-small">
            {data?.store?.map_url ? (
              <iframe src={data.store.map_url} title="Store Location" className="h-48 w-full rounded border" />
            ) : '-'}
          </p>
        </div>

        {/* <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
          <p className="font-medium font-sans txt-compact-small">Social Links</p>
          <div className="font-normal font-sans txt-compact-small flex flex-col space-y-1">
            {data?.store?.social_links ? (
              <>
                {data.store.social_links.facebook && (
                  <a href={data.store.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Facebook
                  </a>
                )}
                {data.store.social_links.twitter && (
                  <a href={data.store.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Twitter
                  </a>
                )}
                {data.store.social_links.instagram && (
                  <a href={data.store.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Instagram
                  </a>
                )}
              </>
            ) : '-'}
          </div>
        </div> */}
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={toggleDrawer}>
        <FormProvider {...form}>
          <Drawer.Content className="w-full md:w-[500px]">
            <Drawer.Header>
              <Heading level="h2">{t('store.widget.title')}</Heading>
            </Drawer.Header>

            <form className="flex-1">
              <Controller
                control={form.control}
                name="logo_file"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2 px-6 py-4">
                      <Label className="font-sans txt-compact-small font-medium">{t('store.field.logo')}</Label>
                      <Label className="flex">
                        <Button size="xlarge" variant="secondary" asChild>
                          {form.watch("logo_url") && (
                            <img
                              src={form.watch("logo_url")!}
                              alt="Logo preview"
                              className="mt-2 h-12 w-auto object-contain"
                            />
                          )}
                        </Button>

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                          disabled={isLoading}
                        />
                      </Label>
                    </div>
                  )
                }}
              />

              <Controller
                control={form.control}
                name="address"
                render={({ field }) => (
                  <div className="flex flex-col space-y-2 px-6 py-4">
                    <Label className="font-sans txt-compact-small font-medium" htmlFor="address">{t('store.field.address')}</Label>
                    <Textarea
                      defaultValue={field.value?.toString()}
                      onChange={e => field.onChange(e.target.value)}
                      placeholder="123 Main St, Tunis, Tunisia"
                      disabled={isLoading}
                    />
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name="contact_emails"
                render={({ field }) => (
                  <div className="flex flex-col space-y-2 px-6 py-4">
                    <Label className="font-sans txt-compact-small font-medium" htmlFor="contact_emails">
                      {t('store.field.email')}
                    </Label>
                    <Input
                      defaultValue={field.value?.toString()}
                      onChange={(e) => field.onChange(e.target.value.split(',').map((email) => email.trim()).filter(Boolean))}
                      placeholder="info@store.com, support@store.com"
                      disabled={isLoading}

                    />
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="contact_phone_numbers"
                render={({ field }) => (
                  <div className="flex flex-col space-y-2 px-6 py-4">
                    <Label className="font-sans txt-compact-small font-medium" htmlFor="contact_phones">
                      {t('store.field.phone')}
                    </Label>
                    <Input
                      defaultValue={field.value?.toString()}
                      onChange={(e) => field.onChange(e.target.value.split(',').map((phone) => phone.trim()).filter(Boolean))}
                      placeholder="+216 XX XXX XXX, +216 YY YYY YYY"
                      disabled={isLoading}

                    />
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="map_url"
                render={({ field }) => (
                  <div className="flex flex-col space-y-2 px-6 py-4">
                    <Label className="font-sans txt-compact-small font-medium" htmlFor="map_url">{t('store.field.map_url')}</Label>
                    <Input
                      defaultValue={field.value?.toString()}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isLoading}
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                  </div>
                )}
              />
            </form>

            <Drawer.Footer>
              <Button onClick={handleSubmit}
                disabled={form.formState.isDirty === false || form.formState.isSubmitting || isPending}>
                {t('common.save')}
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </FormProvider>
      </Drawer>

    </Container>
  );
};
