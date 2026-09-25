import { notFound } from "next/navigation";
import { hubPage } from "@/seo/hub-page";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";
const page=hubPage("book","Book Mobile Car Detailing","Request a mobile detailing appointment with All Things Fresh in Greater Cleveland.","Book your mobile detail.","Tell us about the vehicle, where it will be parked, and the day that works best. We confirm service scope, arrival window, and price before the appointment is scheduled.");
export function generateMetadata(){return{title:page.title,description:page.description,alternates:{canonical:"/book"}};}
export default async function BookPage({params}:PageProps<"/[lang]/book">){const{lang}=await params;if(lang!=="en")notFound();return <LockedSubpage page={page} template="service"/>;}
