export type ProductOptionValueFilter = {
  option_id: string;
  value: string;
};

export type ProductPriceRange = {
  min: number;
  max: number;
};

export type ProductOptionMeta = {
  title: string;
  option_id: string;
  values: string[];
};
