import { createRouter, createWebHistory } from "vue-router";
import DonationPage from "../views/DonationPage.vue";
import ThankYouPage from "../views/ThankYouPage.vue";

const routes = [
  {
    path: "/donate/:eventId",
    name: "DonationPage",
    component: DonationPage,
    props: true,
  },
  {
    path: "/thank-you",
    name: "ThankYouPage",
    component: ThankYouPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
