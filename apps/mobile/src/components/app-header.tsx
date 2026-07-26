import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function AppHeader({title='Akshar',status='Ready',showSettings=true}:{title?:string;status?:string;showSettings?:boolean}){
  return <View style={s.row}><ThemedText type="title">{title}</ThemedText><View style={s.right}><ThemedText type="small">{status}</ThemedText>{showSettings&&<Pressable><MaterialCommunityIcons name="cog-outline" size={24} /></Pressable>}</View></View>;
}
const s=StyleSheet.create({row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},right:{flexDirection:'row',alignItems:'center',gap:12}});
