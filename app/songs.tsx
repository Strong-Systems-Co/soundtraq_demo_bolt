import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Music2, MoveVertical as MoreVertical } from 'lucide-react-native';
import { useState } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  image: string;
  plays: number;
}

const mockSongs: Song[] = [
  {
    id: '1',
    title: 'What Did You Do?',
    artist: 'Fille & Nutty Neithan',
    duration: '3:45',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&fit=crop',
    plays: 15320
  },
  {
    id: '2',
    title: 'Tonight',
    artist: 'Nutty Neithan ft. Beenie Gunter',
    duration: '4:12',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&fit=crop',
    plays: 12450
  },
  {
    id: '3',
    title: 'Bakuwe Kyonywa',
    artist: 'Nutty Neithan',
    duration: '3:58',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&fit=crop',
    plays: 9870
  }
];

export default function Songs() {
  const [songs] = useState<Song[]>(mockSongs);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Songs</Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{songs.length}</Text>
            <Text style={styles.statLabel}>Total Songs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>37.6K</Text>
            <Text style={styles.statLabel}>Total Plays</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>UGX 2.5M</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.songsList}>
          {songs.map((song) => (
            <View key={song.id} style={styles.songCard}>
              <Image source={{ uri: song.image }} style={styles.songImage} />
              <View style={styles.songInfo}>
                <View style={styles.songMainInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                  <View style={styles.songStats}>
                    <Music2 size={14} color="#666" />
                    <Text style={styles.playsText}>
                      {song.plays.toLocaleString()} plays
                    </Text>
                    <Text style={styles.durationText}>{song.duration}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  songsList: {
    padding: 20,
  },
  songCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  songImage: {
    width: '100%',
    height: 200,
  },
  songInfo: {
    flexDirection: 'row',
    padding: 16,
  },
  songMainInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  songStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playsText: {
    fontSize: 12,
    color: '#666',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});