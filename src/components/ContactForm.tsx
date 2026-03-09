import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { springPresets } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createRequest } from "@/api/backoffice";

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  level: z.string().min(1, "Veuillez sélectionner un niveau"),
  subject: z.string().min(1, "Veuillez sélectionner une matière"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createRequest({
        parentName: `${data.firstName} ${data.lastName}`,
        childName: data.lastName, // In a real app we might ask for child name separately, for now use last name
        level: data.level,
        subject: data.subject,
        phone: data.phone,
      });

      setIsSubmitted(true);
      toast({
        title: "Demande envoyée !",
        description:
          "Nous vous contacterons dans les 24h pour votre bilan gratuit.",
      });

      setTimeout(() => {
        setIsSubmitted(false);
        reset();
      }, 3000);
    } catch (error) {
      console.error("Failed to submit contact form", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.gentle}
        className={cn(
          "flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10",
          className
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springPresets.bouncy, delay: 0.2 }}
        >
          <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          Demande envoyée avec succès !
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Merci pour votre confiance. Un conseiller pédagogique vous contactera
          dans les 24h pour établir votre bilan personnalisé gratuit.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPresets.gentle}
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "bg-card border border-border rounded-2xl p-8 shadow-lg",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          Demandez votre bilan gratuit
        </h3>
        <p className="text-muted-foreground">
          Remplissez ce formulaire et recevez un bilan personnalisé sous 24h.
          Sans engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            placeholder="Kouassi"
            {...register("firstName")}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            placeholder="Mbarga"
            {...register("lastName")}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="kouassi.mbarga@email.cm"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+237 6XX XXX XXX"
            {...register("phone")}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Niveau scolaire *</Label>
          <Select onValueChange={(value) => setValue("level", value)}>
            <SelectTrigger
              id="level"
              className={errors.level ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Sélectionnez un niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primaire">Primaire (SIL-CM2 / CEP)</SelectItem>
              <SelectItem value="college">Collège (6e-3e / BEPC)</SelectItem>
              <SelectItem value="lycee">Lycée (2de-Terminale / BAC)</SelectItem>
              <SelectItem value="superieur">
                Études supérieures
              </SelectItem>
              <SelectItem value="adulte">Adulte</SelectItem>
            </SelectContent>
          </Select>
          {errors.level && (
            <p className="text-sm text-destructive">{errors.level.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Matière principale *</Label>
          <Select onValueChange={(value) => setValue("subject", value)}>
            <SelectTrigger
              id="subject"
              className={errors.subject ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Sélectionnez une matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mathematiques">Mathématiques</SelectItem>
              <SelectItem value="francais">Français</SelectItem>
              <SelectItem value="anglais">Anglais</SelectItem>
              <SelectItem value="physique-chimie">
                Physique-Chimie
              </SelectItem>
              <SelectItem value="histoire-geo">
                Histoire-Géographie
              </SelectItem>
              <SelectItem value="svt">SVT</SelectItem>
              <SelectItem value="philosophie">Philosophie</SelectItem>
              <SelectItem value="autre">Autre matière</SelectItem>
            </SelectContent>
          </Select>
          {errors.subject && (
            <p className="text-sm text-destructive">
              {errors.subject.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 mt-6">
        <Label htmlFor="message">Message (optionnel)</Label>
        <Textarea
          id="message"
          placeholder="Décrivez vos besoins ou objectifs pédagogiques..."
          rows={4}
          {...register("message")}
        />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
              />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Demander mon bilan gratuit
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-semibold text-accent">Résultats garantis</span>{" "}
          • Sans engagement • Bilan personnalisé gratuit • Réponse sous 24h
        </p>
      </div>
    </motion.form>
  );
}
