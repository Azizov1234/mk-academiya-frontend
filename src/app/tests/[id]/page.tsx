import TestRunnerClient from './TestRunnerClient';

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default async function TestDetailPage({ params }: Props) {
  const { id } = await params;
  return <TestRunnerClient testId={Number(id)} />;
}
