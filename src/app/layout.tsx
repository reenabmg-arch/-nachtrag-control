import type { Metadata } from 'next';
import './globals.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'NACHTRAG Control',description:'Privates Control-System für eine immersive Live-Experience',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="de"><body>{children}</body></html>; }
