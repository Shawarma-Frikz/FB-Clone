import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { loadCurrentUser } from "../features/auth/authSlice";
import { fetchPosts } from "../services/postService";
import { fetchProfile, updateProfile } from "../services/userService";
import { formatRelativeTime, readFileAsDataUrl } from "../utils/media";

function ProfilePage() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({ name: "", bio: "", avatar: null, coverPhoto: null });
  const [preview, setPreview] = useState({ avatar: "", coverPhoto: "" });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResponse, postsResponse] = await Promise.all([fetchProfile(), fetchPosts()]);
        const user = profileResponse.data?.data?.user;
        const allPosts = postsResponse.data?.data?.posts || [];

        setProfile(user);
        setFormData({ name: user?.name || "", bio: user?.bio || "" });
        setPosts(allPosts.filter((post) => post.user?._id === user?._id));
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const mediaItems = useMemo(
    () => posts.flatMap((post) => (post.media || []).map((media) => ({ media, postId: post._id }))),
    [posts]
  );

  const handleImagePick = async (event, field) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setFormData((current) => ({ ...current, [field]: null }));
      setPreview((current) => ({ ...current, [field]: "" }));
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setFormData((current) => ({ ...current, [field]: file }));
    setPreview((current) => ({ ...current, [field]: dataUrl }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("bio", formData.bio.trim());
      if (formData.avatar) {
        payload.append("avatar", formData.avatar);
      }
      if (formData.coverPhoto) {
        payload.append("coverPhoto", formData.coverPhoto);
      }

      const response = await updateProfile(payload);
      const updatedUser = response.data?.data?.user;
      setProfile(updatedUser);
      setFormData((current) => ({ ...current, avatar: null, coverPhoto: null }));
      setPreview({ avatar: "", coverPhoto: "" });
      setSuccessMessage("Profile updated successfully.");
      dispatch(loadCurrentUser());
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card className="text-sm text-[#65676b]">Loading profile...</Card>;
  }

  if (!profile) {
    return <Card className="text-sm text-[#d93025]">{error || "Profile not found."}</Card>;
  }

  return (
    <div className="space-y-6">
      {error ? <Card className="text-sm text-[#d93025]">{error}</Card> : null}

      <Card className="overflow-hidden p-0">
        <div className="relative h-52 sm:h-72 lg:h-80">
          {preview.coverPhoto || profile.coverPhoto ? (
            <img className="h-full w-full object-cover" src={preview.coverPhoto || profile.coverPhoto} alt="Cover" />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(120deg,#dbeafe_0%,#eff6ff_50%,#f0f2f5_100%)]" />
          )}
        </div>

        <div className="border-b border-[#dce1e8] px-5 pb-5 pt-0 sm:px-7">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar
                src={preview.avatar || profile.avatar}
                name={profile.name}
                size="xl"
                className="relative z-20 h-32 w-32 border-4 border-white shadow-lg sm:h-36 sm:w-36"
              />
              <div className="pb-2">
                <h2 className="text-3xl font-black text-[#1c1e21]">{profile.name || "User"}</h2>
                <p className="mt-1 text-sm text-[#65676b]">{profile.friends?.length || 0} friends</p>
                <p className="mt-1 text-xs text-[#65676b]">
                  Joined {profile.createdAt ? formatRelativeTime(profile.createdAt) : "recently"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="ds-tabs px-3 py-3 sm:px-5" aria-label="Profile tabs">
          <span className="ds-tab ds-tab-active">Posts</span>
          <span className="ds-tab">About</span>
          <span className="ds-tab">Friends</span>
          <span className="ds-tab">Photos</span>
        </nav>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          {successMessage ? <Card className="text-sm text-[#1f7a1f]">{successMessage}</Card> : null}
          <Card>
            <h3 className="text-lg font-bold text-[#1c1e21]">Intro</h3>
            <p className="mt-3 text-sm leading-7 text-[#3a3b3c]">
              {profile.bio || "No bio added yet."}
            </p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1c1e21]">Photos</h3>
              <span className="text-sm text-[#65676b]">{mediaItems.length}</span>
            </div>

            {mediaItems.length ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.slice(0, 9).map((item) => (
                  <img
                    key={`${item.postId}-${item.media}`}
                    className="aspect-square w-full rounded-lg object-cover"
                    src={item.media}
                    alt="Post media"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#65676b]">No photos uploaded yet.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-[#1c1e21]">Edit profile</h3>
            <form className="mt-4 grid gap-3" onSubmit={handleSave}>
              <input
                className="ds-input"
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                placeholder="Display name"
              />
              <textarea
                className="ds-input min-h-28 resize-y"
                value={formData.bio}
                onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Bio"
              />
              <label className="grid gap-1 text-sm text-[#3a3b3c]">
                Profile picture
                <input
                  className="ds-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImagePick(event, "avatar")}
                />
              </label>
              <label className="grid gap-1 text-sm text-[#3a3b3c]">
                Cover picture
                <input
                  className="ds-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImagePick(event, "coverPhoto")}
                />
              </label>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar src={profile.avatar} name={profile.name} size="md" />
              <div className="flex-1 rounded-full border border-[#dce1e8] bg-[#f5f6f7] px-4 py-3 text-sm text-[#65676b]">
                {profile.name} shared {posts.length} post(s)
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {posts.length ? (
              posts.map((post) => (
                <Card key={post._id} className="overflow-hidden p-0">
                  {post.media?.[0] ? (
                    <img className="h-44 w-full object-cover" src={post.media[0]} alt="Post media" />
                  ) : null}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[#1c1e21]">{post.content || "Media post"}</p>
                    <p className="mt-1 text-xs text-[#65676b]">{formatRelativeTime(post.createdAt)}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-[#65676b]">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>{post.comments?.length || 0} comments</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="sm:col-span-2 text-sm text-[#65676b]">No posts yet.</Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
