import { GardenForm } from '@itp-home-garden/web-feature-gardens';

export default function NewGardenPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">New garden</h1>
      <div className="max-w-md">
        <GardenForm />
      </div>
    </div>
  );
}
