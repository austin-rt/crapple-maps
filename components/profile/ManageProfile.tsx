import { Icon } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar, INPUT_CLS } from '@/components/ui';
import { useLogCount, useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { deleteAccount } from '@/lib/db/moderation';
import { toast } from '@/lib/toast';
import { updateAvatarSeed, updateProfile, uploadAvatar } from '@/lib/db/profiles';
import { shareProfile } from '@/lib/share';
import { ACCENT, DANGER } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

import { AppearanceCard } from './AppearanceCard';
import { AvatarCropper, type CropSource } from './AvatarCropper';
import { Card } from './Card';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const USERNAME_HINT = '3–30 lowercase letters, numbers or underscores. Profile links you shared under your old username stop working.';

function Stat({ label, value, onPress }: { label: string; value: number; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value} ${label}`}
      className="flex-1 items-center active:opacity-60">
      <Text className="text-lg font-bold text-content">{value}</Text>
      <Text className="text-xs text-content-2">{label}</Text>
    </Pressable>
  );
}

export function ManageProfile() {
  const ptr = usePullToRefresh();
  const c = useColors();
  const { session, signOut, changePassword } = useAuth();
  const qc = useQueryClient();
  const uid = session!.user.id;

  const { data: profile } = useProfile(uid);
  const { data: logCount = 0 } = useLogCount(uid);

  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [username, setUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setUsername(profile.username ?? '');
    }
  }, [profile]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile(uid, { display_name: displayName.trim() || null });
      qc.invalidateQueries({ queryKey: ['profile', uid] });
      toast.success('Profile saved');
    } catch (e: any) {
      toast.error("Couldn't save profile", e?.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const usernameValid = /^[a-z0-9_]{3,30}$/.test(username);
  const usernameChanged = !!profile && username !== profile.username;

  const saveUsername = async () => {
    if (!usernameValid) return toast.error('Username not allowed', USERNAME_HINT);
    setSavingUsername(true);
    try {
      await updateProfile(uid, { username });
      qc.invalidateQueries({ queryKey: ['profile', uid] });
      qc.invalidateQueries({ queryKey: ['public-profile'] });
      toast.success('Username changed', `You're now @${username}`);
    } catch (e: any) {
      toast.error(e?.code === '23505' ? 'That username is taken' : "Couldn't change username", e?.code === '23505' ? 'Try a different one.' : e?.message);
    } finally {
      setSavingUsername(false);
    }
  };

  const changePw = async () => {
    if (newPw.length < 6) return toast.error('Password too short', 'Use at least 6 characters.');
    setSavingPw(true);
    const { error } = await changePassword(newPw);
    setSavingPw(false);
    if (error) return toast.error("Couldn't change password", error);
    setNewPw('');
    toast.success('Password changed');
  };

  const shuffle = async () => {
    const seed = `${uid.slice(0, 8)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
    try {
      await updateAvatarSeed(uid, seed);
      qc.invalidateQueries({ queryKey: ['profile', uid] });
      toast.success('Avatar shuffled');
    } catch (e: any) {
      toast.error("Couldn't shuffle avatar", e?.message);
    }
  };

  const uploadPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled) return;
    const a = res.assets[0];
    setCropSource({ uri: a.uri, width: a.width, height: a.height });
  };

  const saveCropped = async (uri: string) => {
    setCropSource(null);
    try {
      await uploadAvatar(uid, uri);
      qc.invalidateQueries({ queryKey: ['profile', uid] });
      toast.success('Photo updated');
    } catch (e: any) {
      toast.error('Upload failed', e?.message ?? String(e));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-5 pb-16"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      refreshControl={ptr.control}>
      {cropSource ? <AvatarCropper source={cropSource} onCancel={() => setCropSource(null)} onDone={saveCropped} /> : null}
      <View className="items-center pt-8">
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 84, height: 84, borderRadius: 42 }} className="bg-surface-3" />
        ) : (
          <Avatar seed={profile?.avatar_seed || profile?.username || uid} size={84} />
        )}
        <View className="mt-3 flex-row gap-2">
          <Pressable onPress={uploadPhoto} className="flex-row items-center gap-1 rounded-full border border-line px-3 py-1.5 active:opacity-70">
            <Icon name="camera-outline" size={14} color={c.content2} />
            <Text className="text-xs font-medium text-content-2">Upload photo</Text>
          </Pressable>
          <Pressable onPress={shuffle} className="flex-row items-center gap-1 rounded-full border border-line px-3 py-1.5 active:opacity-70">
            <Icon name="shuffle" size={14} color={c.content2} />
            <Text className="text-xs font-medium text-content-2">Shuffle</Text>
          </Pressable>
        </View>
        <Text className="mt-3 text-xl font-bold text-content">{profile?.display_name || profile?.username || 'You'}</Text>
        {profile?.username ? <Text className="text-sm text-content-2">@{profile.username}</Text> : null}
        <Text className="mt-0.5 text-xs text-content-2">{session!.user.email}</Text>
        {profile?.username ? (
          <Pressable
            onPress={() => shareProfile(profile.username)}
            accessibilityRole="button"
            accessibilityLabel="Share profile"
            className="mt-4 flex-row items-center gap-2 rounded-full px-5 py-2.5 active:opacity-80"
            style={{ backgroundColor: ACCENT }}>
            <Icon name="share-outline" size={16} color="#fff" />
            <Text className="font-semibold text-white">Share profile</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-6 flex-row rounded-2xl border border-line py-4">
        <Stat label="Logs" value={logCount} />
        <View className="w-px bg-surface-3" />
        <Stat label="Followers" value={profile?.followers_count ?? 0} onPress={() => router.push({ pathname: '/follows', params: { tab: 'followers' } })} />
        <View className="w-px bg-surface-3" />
        <Stat label="Following" value={profile?.following_count ?? 0} onPress={() => router.push({ pathname: '/follows', params: { tab: 'following' } })} />
      </View>

      <AppearanceCard />

      <Pressable
        onPress={() => router.push('/saved')}
        className="mt-4 flex-row items-center gap-3 rounded-2xl border border-line p-4 active:opacity-70">
        <Icon name="bookmark-outline" size={20} color={ACCENT} />
        <Text className="flex-1 text-base font-medium text-content">Saved restrooms</Text>
        <Icon name="chevron-forward" size={18} color={c.content2} />
      </Pressable>

      <Card title="Profile & account">
        <Text className="mb-1 text-sm text-content-2">Display name</Text>
        <TextInput placeholder="Your name" placeholderTextColor={c.content2} value={displayName} onChangeText={setDisplayName} className={INPUT_CLS} />
        <Pressable
          onPress={saveProfile}
          disabled={savingProfile}
          className={`mt-3 items-center rounded-xl py-3 ${savingProfile ? 'opacity-50' : ''}`}
          style={{ backgroundColor: ACCENT }}>
          <Text className="font-semibold text-white">{savingProfile ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>

        <View className="my-4 h-px bg-surface-3" />

        <Text className="mb-1 text-sm text-content-2">Username</Text>
        <View className="flex-row items-center">
          <Text className="mr-1 text-base text-content-2">@</Text>
          <TextInput
            placeholder="username"
            placeholderTextColor={c.content2}
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            className={INPUT_CLS}
            style={{ flex: 1, minWidth: 0 }}
          />
        </View>
        <Text className="mt-1 text-xs text-content-2">{USERNAME_HINT}</Text>
        <Pressable
          onPress={saveUsername}
          disabled={savingUsername || !usernameChanged}
          className={`mt-3 items-center rounded-xl border border-line py-3 ${savingUsername || !usernameChanged ? 'opacity-50' : ''}`}>
          <Text className="font-semibold text-content">{savingUsername ? 'Saving…' : 'Change username'}</Text>
        </Pressable>

        <View className="my-4 h-px bg-surface-3" />

        <Text className="mb-1 text-sm text-content-2">New password</Text>
        <TextInput placeholder="••••••" placeholderTextColor={c.content2} value={newPw} onChangeText={setNewPw} secureTextEntry className={INPUT_CLS} />
        <Pressable
          onPress={changePw}
          disabled={savingPw || !newPw}
          className={`mt-3 items-center rounded-xl border border-line py-3 ${savingPw || !newPw ? 'opacity-50' : ''}`}>
          <Text className="font-semibold text-content">{savingPw ? 'Updating…' : 'Change password'}</Text>
        </Pressable>
      </Card>

      <Pressable
        onPress={() => signOut()}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-red-300 py-3 active:opacity-70 dark:border-red-900">
        <Icon name="log-out-outline" size={18} color={DANGER} />
        <Text className="font-semibold text-red-500">Sign out</Text>
      </Pressable>

      <Pressable
        onPress={() =>
          confirmAction(
            'Delete your account?',
            'This permanently deletes your profile, logs, comments, likes, photos, and saved places. Restrooms you added stay on the map without your name. This cannot be undone.',
            async () => {
              try {
                await deleteAccount();
                await signOut();
                toast.success('Account deleted');
              } catch (e: any) {
                toast.error("Couldn't delete account", e?.message);
              }
            },
            { confirmLabel: 'Delete forever', destructive: true },
          )
        }
        className="mt-3 items-center justify-center py-3 active:opacity-70">
        <Text className="text-sm font-semibold" style={{ color: DANGER }}>Delete account</Text>
      </Pressable>

      <View className="mb-2 mt-4 flex-row items-center justify-center gap-4">
        <Text className="text-xs text-content-2 underline" onPress={() => Linking.openURL('https://crapplemaps.com/privacy')}>
          Privacy policy
        </Text>
        <Text className="text-xs text-content-2 underline" onPress={() => Linking.openURL('https://crapplemaps.com/terms')}>
          Terms of use
        </Text>
      </View>
    </ScrollView>
  );
}
