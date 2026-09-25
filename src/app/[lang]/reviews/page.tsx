import { notFound } from "next/navigation";
import { hubPage } from "@/seo/hub-page";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";
const page=hubPage("reviews","Customer Reviews","Read verified customer feedback for All Things Fresh mobile car detailing in Greater Cleveland.","What customers say after the detail.","Reviews shown on this site must come from an approved source record. The admin can feature or remove a review, but it cannot create a claim that has not been verified.");
export function generateMetadata(){return{title:page.title,description:page.description,alternates:{canonical:"/reviews"},robots:{index:false,follow:true}};}
export default async function ReviewsPage({params}:PageProps<"/[lang]/reviews">){const{lang}=await params;if(lang!=="en")notFound();return <LockedSubpage page={page} template="article"/>;}
