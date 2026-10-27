import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { partesDaData } from '../datas';
import { cores, raio } from '../theme';
import Botao from './Botao';

export default function EventoCard({ evento, onEditar, onExcluir }) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const { ano, dia, mes } = partesDaData(evento.data);

  return (
    <View style={s.card} testID={`evento-${evento.id}`}>
      <View style={s.imagemBox}>
        {evento.imagem && !imagemFalhou ? (
          <Image
            source={{ uri: evento.imagem }}
            accessibilityLabel={`Imagem do evento ${evento.nome}`}
            style={s.imagem}
            resizeMode="cover"
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <Text style={s.semImagem}>Sem imagem</Text>
        )}
        <View style={s.selo} accessible accessibilityLabel={`Data ${dia} de ${mes} de ${ano}`}>
          <Text style={s.seloDia}>{dia}</Text>
          <Text style={s.seloMes}>{mes}</Text>
          <Text style={s.seloAno}>{ano}</Text>
        </View>
      </View>

      <View style={s.corpo}>
        <Text style={s.titulo}>{evento.nome}</Text>
        <Text style={s.local}>📍 {evento.localizacao}</Text>
      </View>

      <View style={s.acoes}>
        <Botao titulo="Editar" variante="secundario" pequeno onPress={onEditar} />
        <Botao titulo="Excluir" variante="perigo" pequeno onPress={onExcluir} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio,
    borderWidth: 1,
    borderColor: cores.linha,
    overflow: 'hidden',
  },
  imagemBox: {
    height: 150,
    backgroundColor: '#dfe5f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagem: { width: '100%', height: '100%' },
  semImagem: { color: cores.tintaSuave, fontSize: 14 },
  selo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: cores.ambar,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  seloDia: { fontSize: 20, fontWeight: '800', color: cores.tinta, lineHeight: 22 },
  seloMes: { fontSize: 12, fontWeight: '700', color: cores.tinta, textTransform: 'uppercase' },
  seloAno: { fontSize: 11, color: cores.tinta },
  corpo: { padding: 14, gap: 4 },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.tinta },
  local: { fontSize: 14, color: cores.tintaSuave },
  acoes: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
});
