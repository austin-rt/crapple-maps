import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar, INPUT_CLS } from '@/components/ui';
import { useLogCount, useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { updateAvatarSeed, updateProfile, uploadAvatar } from '@/lib/db/profiles';
import { ACCENT, DANGER } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

import { AppearanceCard } from './AppearanceCard';
import { Card } from './Card';

function Stat({ label, value }: { label: string; value: number }) {
  const c = useColors();
  return (
    <View className="flex-1 items-center">
      <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{value}</Text>
      <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
    </View>
  );
}

export function ManageProfile() {
  const c = useColors();
  const { session, signOut, changePassword } = useAuth();
  const qc = useQueryClient();
  const uid = session!.user.id;

  const { data: profile } = useProfile(uid);
  const { data: logCount = 0 } = useLogCount(uid);

  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? '');
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
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled) return;
    try {
      await uploadAvatar(uid, res.assets[0].uri);
      qc.invalidateQueries({ queryKey: ['profile', uid] });
      toast.success('Photo updated');
    } catch (e: any) {
      toast.error('Upload failed', e?.message ?? String(e));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="px-5 pb-16"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <View className="items-center pt-8">
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 84, height: 84, borderRadius: 42 }} className="bg-neutral-200 dark:bg-neutral-800" />
        ) : (
          <Avatar seed={profile?.avatar_seed || profile?.username || uid} size={84} />
        )}
        <View className="mt-3 flex-row gap-2">
          <Pressable onPress={uploadPhoto} className="flex-row items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 active:opacity-70 dark:border-neutral-700">
            <Ionicons name="camera-outline" size={14} color={c.content2} />
            <Text className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Upload photo</Text>
          </Pressable>
          <Pressable onPress={shuffle} className="flex-row items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 active:opacity-70 dark:border-neutral-700">
            <Ionicons name="shuffle" size={14} color={c.content2} />
            <Text className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Shuffle</Text>
          </Pressable>
        </View>
        <Text className="mt-3 text-xl font-bold text-neutral-900 dark:text-neutral-50">{profile?.display_name || profile?.username || 'You'}</Text>
        {profile?.username ? <Text className="text-sm text-neutral-500 dark:text-neutral-400">@{profile.username}</Text> : null}
        <Text className="mt-0.5 text-xs text-neutral-400">{session!.user.email}</Text>
      </View>

      <View className="mt-6 flex-row rounded-2xl border border-neutral-200 py-4 dark:border-neutral-800">
        <Stat label="Logs" value={logCount} />
        <View className="w-px bg-neutral-200 dark:bg-neutral-800" />
        <Stat label="Followers" value={profile?.followers_count ?? 0} />
        <View className="w-px bg-neutral-200 dark:bg-neutral-800" />
        <Stat label="Following" value={profile?.following_count ?? 0} />
      </View>

      <AppearanceCard />

      <Pressable
        onPress={() => router.push('/saved')}
        className="mt-4 flex-row items-center gap-3 rounded-2xl border border-neutral-200 p-4 active:opacity-70 dark:border-neutral-800">
        <Ionicons name="bookmark-outline" size={20} color={ACCENT} />
        <Text className="flex-1 text-base font-medium text-neutral-900 dark:text-neutral-50">Saved restrooms</Text>
        <Ionicons name="chevron-forward" size={18} color={c.content2} />
      </Pressable>

      <Card title="Profile & account">
        <Text className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">Display name</Text>
        <TextInput placeholder="Your name" placeholderTextColor={c.content2} value={displayName} onChangeText={setDisplayName} className={INPUT_CLS} />
        <Pressable
          onPress={saveProfile}
          disabled={savingProfile}
          className={`mt-3 items-center rounded-xl py-3 ${savingProfile ? 'opacity-50' : ''}`}
          style={{ backgroundColor: ACCENT }}>
          <Text className="font-semibold text-white">{savingProfile ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>

        <View className="my-4 h-px bg-neutral-200 dark:bg-neutral-800" />

        <Text className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">New password</Text>
        <TextInput placeholder="••••••" placeholderTextColor={c.content2} value={newPw} onChangeText={setNewPw} secureTextEntry className={INPUT_CLS} />
        <Pressable
          onPress={changePw}
          disabled={savingPw || !newPw}
          className={`mt-3 items-center rounded-xl border border-neutral-300 py-3 dark:border-neutral-700 ${savingPw || !newPw ? 'opacity-50' : ''}`}>
          <Text className="font-semibold text-neutral-900 dark:text-neutral-100">{savingPw ? 'Updating…' : 'Change password'}</Text>
        </Pressable>
      </Card>

      <Pressable
        onPress={() => signOut()}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-red-300 py-3 active:opacity-70 dark:border-red-900">
        <Ionicons name="log-out-outline" size={18} color={DANGER} />
        <Text className="font-semibold text-red-500">Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
