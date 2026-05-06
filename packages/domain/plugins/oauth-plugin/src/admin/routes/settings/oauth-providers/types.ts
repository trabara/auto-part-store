
type OAuthProvider = {
  id: string;
  provider: string;
  client_id: string;
  client_secret: string;
  callback_url: string;
  success_redirect_url: string;
  enabled: boolean;
};
