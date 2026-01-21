import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] p-4">
      <UserProfile
        path="/user-profile"
        routing="path"
        appearance={{
          baseTheme: undefined,
          elements: {
            rootBox: "mx-auto",
            card: "bg-white/5 backdrop-blur-xl border border-white/10",
          },
        }}
      />
    </div>
  );
}
