import Layout from "@/modules/app/containers/app-layout"
import { NextPageWithLayout } from "./_app"
import HomeTemplate from "@/modules/home/containers"

const Home: NextPageWithLayout = () => {
  return <HomeTemplate />
}

Home.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>
}

export default Home
