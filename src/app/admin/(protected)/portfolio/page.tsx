import React from "react";
import { getAdminPortfolioProjects } from "@/lib/cms/queries";
import { PortfolioManagerClient } from "@/components/admin/PortfolioManagerClient";

export default async function AdminPortfolioPage() {
  const { projects } = await getAdminPortfolioProjects();
  return <PortfolioManagerClient initialProjects={projects} />;
}

