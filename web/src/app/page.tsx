import type { Metadata } from 'next';
import MainApp from '@/components/MainApp';

export const metadata: Metadata = {
  title: 'Plataforma de Votación DAO',
  description: 'Sistema de votación descentralizado con meta-transacciones sin gas',
};

export default function Home() {
  return (
    <>
      <MainApp />
    </>
  );
}
