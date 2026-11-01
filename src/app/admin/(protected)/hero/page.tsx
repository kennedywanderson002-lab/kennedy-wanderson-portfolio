import React from "react";
import { getAdminHeroSlides } from "@/lib/cms/queries";
import { HeroManagerClient } from "@/components/admin/HeroManagerClient";

export default async function AdminHeroPage() {
  const { slides } = await getAdminHeroSlides();
  return <HeroManagerClient initialSlides={slides} />;
}

